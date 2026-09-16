# Chapter 21 — Callbacks and the Event Loop

## 21.1 Synchronous vs. asynchronous execution

Every JavaScript program starts by running **synchronous** code: statements
execute one at a time, in order, and each statement must finish before the
next one begins.

```js
console.log("A");
console.log("B");
console.log("C");
// Output: A, B, C — always, every time, in that exact order.
```

**Asynchronous** code breaks that one-thing-at-a-time ordering on purpose.
Some operation is *started* now but *finishes* later, and the rest of your
program keeps running in the meantime instead of freezing to wait for it.

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// Output: A, C, B — even with a 0ms delay!
```

`B` prints last even though its delay is `0`. This single surprising result
is the doorway into everything this chapter explains. `setTimeout` never
runs its callback *immediately*, no matter how small the delay — it always
defers it to "later," and "later" is scheduled by a mechanism called the
**event loop**.

## 21.2 The call stack

JavaScript executes code using a **call stack** — a simple, single-threaded
data structure that tracks "what function is currently running, and what
called it." Every time a function is called, a new **stack frame** is
pushed on top. When that function returns, its frame is popped off.

```js
function multiply(a, b) {
  return a * b;
}

function square(n) {
  return multiply(n, n);
}

function printSquare(n) {
  console.log(square(n));
}

printSquare(5);
```

Trace the stack for this call:

```
1. printSquare(5) pushed        stack: [printSquare]
2. square(5) pushed             stack: [printSquare, square]
3. multiply(5, 5) pushed        stack: [printSquare, square, multiply]
4. multiply returns 25, popped  stack: [printSquare, square]
5. square returns 25, popped    stack: [printSquare]
6. console.log(25) pushed/popped
7. printSquare returns, popped  stack: []
```

Because there is only **one** call stack, JavaScript can only ever execute
one piece of code at a time — this is what "single-threaded" means in
practice. If a function on the stack takes a long time (a huge loop, a
synchronous computation), *nothing else can happen* — not a click handler,
not a timer callback, not a network response — until that frame finishes
and is popped. This is called **blocking the main thread**, and it's the
reason a slow synchronous function can freeze an entire web page.

```js
function blockFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {} // busy-wait — burns CPU, blocks everything
}

console.log("start");
blockFor(3000); // the whole tab is frozen for 3 seconds — no clicks,
                 // no rendering, no timers fire — the stack is not empty
console.log("done");
```

## 21.3 Callback-based asynchronous APIs

A **callback** is simply a function passed as an argument to another
function, to be invoked later. Asynchronous callbacks are how JavaScript
historically handled "do this, and when it's done, run this other code":

```js
console.log("1: scheduling work");

setTimeout(function onTimeout() {
  console.log("3: timeout fired");
}, 1000);

console.log("2: scheduling done, moving on");
```

`setTimeout` doesn't pause anything. It registers `onTimeout` with the
runtime and returns immediately. The runtime is responsible for calling
`onTimeout` back once (at least) 1000ms have passed *and* the call stack is
empty.

### The error-first callback convention (Node.js style)

Before promises existed, Node.js standardized a convention for
callback-based APIs: the callback's **first argument is always reserved for
an error** (or `null` if there wasn't one), and subsequent arguments carry
the actual result.

```js
const fs = require("fs");

fs.readFile("config.json", "utf8", function (err, data) {
  if (err) {
    console.error("Failed to read file:", err.message);
    return; // stop here — don't try to use `data`, it doesn't exist
  }
  console.log("File contents:", data);
});
```

Every built-in Node.js callback API follows this pattern: `fs.readFile`,
`fs.writeFile`, `crypto.randomBytes`, database drivers, and most npm
packages written before ~2017. Checking `err` first, and returning early on
error, is a habit you should build immediately — forgetting it is one of
the most common sources of silent bugs in callback-style code.

## 21.4 Callback hell (the pyramid of doom)

The trouble with callbacks appears when asynchronous operations depend on
each other — step 2 can't start until step 1 finishes, step 3 needs step
2's result, and so on. Nesting callback inside callback inside callback
produces code that grows sideways instead of downward:

```js
getUser(userId, function (err, user) {
  if (err) return handleError(err);
  getOrders(user.id, function (err, orders) {
    if (err) return handleError(err);
    getOrderDetails(orders[0].id, function (err, details) {
      if (err) return handleError(err);
      calculateShipping(details, function (err, shipping) {
        if (err) return handleError(err);
        applyDiscount(shipping, user.membership, function (err, final) {
          if (err) return handleError(err);
          console.log("Final price:", final);
          // five levels deep, and still growing...
        });
      });
    });
  });
});
```

This shape is nicknamed **"callback hell"** or the **"pyramid of doom"**.
Beyond looking ugly, it has real, practical problems:

- **Error handling is repeated at every level** and easy to forget at any
  one of them, silently swallowing failures.
- **Control flow is hard to follow** — reading top-to-bottom no longer
  matches "what happens first."
- **Composing async operations is awkward** — running two independent
  requests in parallel and waiting for both requires manual counters.
- **Reusability suffers** — the logic is trapped inside deeply nested
  anonymous functions.

Callback hell is precisely the problem **Promises** (Chapter 22) and later
**async/await** (Chapter 23) were designed to solve. It's worth feeling the
pain of this pattern once, deliberately, so the motivation for promises
isn't just "because everyone says so."

## 21.5 The event loop: the precise mechanics

This is the single most important diagram in asynchronous JavaScript.
The JavaScript runtime is made of a few cooperating pieces:

```
 ┌───────────────────────────┐
 │         Call Stack         │  <- your running JS code, one frame at a time
 └─────────────┬─────────────┘
               │ empty?
               ▼
 ┌───────────────────────────┐      ┌──────────────────────────┐
 │      Microtask Queue       │◄─────┤   Promise .then/.catch,   │
 │  (drained FULLY, always,   │      │   queueMicrotask(),       │
 │   before the next task)    │      │   async/await resumption  │
 └─────────────┬─────────────┘      └──────────────────────────┘
               │ fully empty
               ▼
 ┌───────────────────────────┐      ┌──────────────────────────┐
 │   Macrotask ("Task") Queue │◄─────┤  setTimeout/setInterval,  │
 │  (ONE task runs, then      │      │  I/O callbacks, UI events │
 │   loop checks microtasks   │      │  (browser), setImmediate  │
 │   again before the next)   │      │  (Node.js)                │
 └───────────────────────────┘      └──────────────────────────┘
```

The **event loop** is the runtime's forever-running coordinator. On every
"tick" it does, roughly:

1. Run code on the call stack until it's empty (all synchronous code in the
   current script/task finishes).
2. Once the stack is empty, drain the **microtask queue completely** —
   run every microtask, and if a microtask schedules another microtask,
   run that one too, before moving on. The microtask queue must reach
   *zero* items before step 3.
3. Take exactly **one** task from the macrotask queue, run it (which
   involves pushing it onto the call stack and repeating step 1).
4. In browsers, potentially render a frame here if one is due.
5. Go back to step 2.

**The critical rule to memorize: all pending microtasks always run before
the next macrotask, no exceptions.** Microtasks are:
- `Promise.prototype.then/catch/finally` callbacks
- `queueMicrotask(fn)`
- code after an `await` in an async function (it's sugar for `.then`)

Macrotasks ("tasks") are:
- `setTimeout` / `setInterval` callbacks
- I/O callbacks (`fs.readFile`, network callbacks)
- UI events (click, scroll) in browsers
- `setImmediate` (Node.js only)
- each `<script>` execution (browsers)

### Worked example: predict the order

Before reading the explanation, try to predict the console output of this
program on your own:

```js
console.log("1: script start");

setTimeout(() => console.log("2: setTimeout callback"), 0);

Promise.resolve()
  .then(() => console.log("3: promise .then #1"))
  .then(() => console.log("4: promise .then #2"));

queueMicrotask(() => console.log("5: queueMicrotask"));

console.log("6: script end");
```

Walking through the event loop rules:

1. `"1: script start"` logs immediately — synchronous.
2. `setTimeout(...)` registers its callback as a **macrotask** and returns
   immediately — nothing logs yet.
3. `Promise.resolve().then(...)` registers `"3: promise .then #1"` as a
   **microtask** — nothing logs yet, and the second `.then` isn't even
   queued yet (it only gets queued once the first one resolves).
4. `queueMicrotask(...)` registers `"5: queueMicrotask"` as a microtask.
5. `"6: script end"` logs immediately — synchronous.
6. **Stack is now empty.** The event loop drains the microtask queue in
   FIFO order: `"3: promise .then #1"` runs, which queues
   `"4: promise .then #2"` as a *new* microtask — it still runs before any
   macrotask, because the microtask queue isn't empty yet. Then
   `"5: queueMicrotask"` runs. Then `"4: promise .then #2"` runs. Now the
   microtask queue is finally empty.
7. Only now does the event loop take the one macrotask waiting —
   `"2: setTimeout callback"` — and run it.

Final order: **1, 6, 3, 5, 4, 2**.

If this doesn't match your first guess, you're in good company — this is
the #1 JavaScript interview question for a reason. The takeaway rule:
**promises always jump the queue ahead of `setTimeout`, no matter the
delay**, because promise callbacks are microtasks and `setTimeout`
callbacks are macrotasks, and microtasks always fully drain first.

## 21.6 Why `setTimeout(fn, 0)` isn't "immediately"

`setTimeout(fn, 0)` does not mean "run `fn` right now." It means "run `fn`
as a macrotask as soon as possible" — which is *after* the current
synchronous code finishes **and** after every pending microtask has run.
In practice this makes `setTimeout(fn, 0)` a useful trick to defer work
until the browser or Node has had a chance to do other things first (like
render a frame or process I/O), but it is never truly instant.

## 21.7 Callbacks that never let go: repeated events

Not every callback runs once and disappears. Event listeners and
`setInterval` register callbacks that can fire many times:

```js
let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log("tick", count);
  if (count === 3) {
    clearInterval(intervalId); // always store the id so you can cancel it
  }
}, 500);
```

Forgetting to clear an interval or remove an event listener you no longer
need is a common source of memory leaks and "why is this running twice"
bugs — a theme we'll revisit in Chapter 28 (Events).

## 21.8 Chapter summary

- Synchronous code runs top-to-bottom on the single call stack; nothing
  else can run while the stack is busy — this is "blocking."
- Asynchronous APIs (timers, I/O, network) hand work off to the runtime and
  register a callback to run later, without blocking the stack.
- Node.js callbacks conventionally use the **error-first** signature:
  `(err, result) => {}`.
- Deeply nested dependent callbacks produce **callback hell**, which hurts
  readability, error handling, and composability — the motivation for
  promises and async/await.
- The **event loop** repeatedly: runs the stack to empty, then fully drains
  the **microtask queue** (promises, `queueMicrotask`), then runs exactly
  one **macrotask** (`setTimeout`, I/O, events), then repeats.
- Microtasks always run before the next macrotask — this is why promise
  callbacks consistently "beat" `setTimeout(fn, 0)`.

## 21.9 Exercises

1. Before running it, predict the console output order of
   `examples/21-callbacks-event-loop.js`'s `orderingPuzzle()` function.
   Then run it and compare.
2. Rewrite the 5-level-deep callback pyramid in this chapter using named
   functions instead of anonymous inline functions. Does it become easier
   to read? What's still awkward about it?
3. Add a `console.log` inside a `setInterval` callback and inside a
   microtask created with `queueMicrotask` in the same tick as the
   interval fires. Which one prints first, every time? Why?
