# Chapter 22 — Promises

## 22.1 What is a Promise?

A **Promise** is a built-in JavaScript object that represents the
*eventual* result of an asynchronous operation — a placeholder for a value
that doesn't exist yet, but will (or will fail to) at some point in the
future. Promises were standardized in ES2015 specifically to solve the
callback hell problem from Chapter 21.

Every promise exists in exactly one of three states:

- **Pending** — the initial state; the operation hasn't finished yet.
- **Fulfilled** — the operation completed successfully; the promise now
  holds a resulting value.
- **Rejected** — the operation failed; the promise now holds a reason
  (usually an `Error`).

Once a promise leaves the pending state, it is **settled**, and it can
never change state again — a fulfilled promise stays fulfilled with that
same value forever; a rejected promise stays rejected with that same reason
forever. This immutability-after-settling is a deliberate design choice
that makes promises predictable and safe to hand to multiple consumers.

```
        resolve(value)
Pending ───────────────► Fulfilled  (settled, permanent)
   │
   │ reject(reason)
   ▼
Rejected  (settled, permanent)
```

## 22.2 Creating a promise

You create a promise with the `Promise` constructor, which takes a single
**executor function** with two parameters: `resolve` and `reject`. The
executor runs *immediately and synchronously* when the promise is
constructed.

```js
const promise = new Promise((resolve, reject) => {
  const success = Math.random() > 0.5;
  setTimeout(() => {
    if (success) {
      resolve("Operation succeeded!");
    } else {
      reject(new Error("Operation failed!"));
    }
  }, 1000);
});
```

Calling `resolve(value)` transitions the promise to fulfilled with that
value. Calling `reject(reason)` transitions it to rejected. Calling either
one after the promise has already settled has no effect — the first call
wins and all others are silently ignored.

In practice, **you rarely construct promises by hand**. Most of the time
you receive promises from other APIs (`fetch`, `fs.promises.readFile`,
database drivers). You mainly write `new Promise(...)` yourself when
**wrapping** an older callback-based API — see 22.6.

## 22.3 Consuming a promise: `.then`, `.catch`, `.finally`

```js
promise
  .then((result) => {
    console.log("Success:", result);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  })
  .finally(() => {
    console.log("This always runs, success or failure");
  });
```

- `.then(onFulfilled, onRejected)` registers callbacks for the fulfilled
  and (optionally) rejected cases.
- `.catch(onRejected)` is exactly equivalent to `.then(undefined, onRejected)`
  — a shorthand for handling errors.
- `.finally(onSettled)` runs regardless of outcome, receives no argument,
  and is used for cleanup (hiding a loading spinner, closing a connection).

Crucially, `.then`, `.catch`, and `.finally` all **return a new promise**,
which is what makes chaining possible.

## 22.4 Chaining promises correctly

Each `.then` callback's **return value** becomes the fulfillment value of
the *next* promise in the chain. This is the single most important rule
for using promises correctly.

```js
fetchUser(1)
  .then((user) => {
    console.log("Got user:", user.name);
    return fetchOrders(user.id); // returning a PROMISE here...
  })
  .then((orders) => {
    // ...means this callback waits for it and receives its resolved value
    console.log("Got orders:", orders.length);
    return orders.length;
  })
  .then((count) => {
    console.log("Order count:", count);
  })
  .catch((err) => {
    // catches an error from ANY of the steps above — fetchUser,
    // fetchOrders, or any .then callback that throws
    console.error("Pipeline failed:", err.message);
  });
```

If a `.then` callback returns a **plain value**, the next `.then` receives
that value directly. If it returns **another promise**, the chain
automatically waits for that promise to settle and unwraps its result —
this is what lets you flatten what would have been nested callbacks into a
single readable vertical chain.

### The classic mistake: forgetting to `return`

```js
// BUG: forgot to `return` the inner promise
fetchUser(1).then((user) => {
  fetchOrders(user.id).then((orders) => {
    console.log(orders); // this still works...
  });
  // but nothing is returned here, so the OUTER chain's next .then
  // (if any) receives `undefined` immediately, without waiting
});
```

Always `return` inside a `.then` callback when you want the next link in
the chain to wait for an inner asynchronous operation. Forgetting this
`return` is one of the most common promise bugs in real codebases —
operations silently run "in the background" instead of being awaited by
the chain, and error handling downstream never sees their failures.

### A single `.catch` handles every prior failure

An error thrown anywhere in a promise chain — inside the executor, inside
any `.then` callback, or a promise that rejects — skips straight to the
nearest `.catch` down the chain, exactly like a synchronous `try`/`catch`
skips to the `catch` block. You do not need (and generally should not add)
a separate `.catch` after every single `.then`.

## 22.5 Combinators: running promises together

Real programs frequently need to coordinate *multiple* promises. ES2015
gave us `Promise.all` and `Promise.race`; ES2020/2021 added
`Promise.allSettled` and `Promise.any`.

### `Promise.all` — wait for all, fail fast on any rejection

```js
Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])
  .then((users) => {
    console.log("All three users:", users); // array, same order as input
  })
  .catch((err) => {
    // fires as soon as ANY of the promises rejects — the others' results
    // (even if they later succeed) are discarded
    console.error("At least one failed:", err.message);
  });
```

Use `Promise.all` when you need *every* result and are fine treating any
single failure as a total failure.

### `Promise.allSettled` — wait for all, never short-circuits

```js
Promise.allSettled([fetchUser(1), fetchUser(-1), fetchUser(3)]).then(
  (results) => {
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        console.log(`User ${i}:`, result.value);
      } else {
        console.log(`User ${i} failed:`, result.reason.message);
      }
    });
  }
);
```

Use `Promise.allSettled` when partial failure is acceptable and you want
to know the outcome of *every* operation, successful or not — e.g.,
sending notifications to five users where one bad email shouldn't cancel
the other four.

### `Promise.race` — settles as soon as the first one settles

```js
Promise.race([
  fetchWithTimeout("https://api.example.com/data", 3000),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Global timeout")), 5000)
  ),
]).then(console.log).catch(console.error);
```

`Promise.race` settles (fulfilled *or* rejected) as soon as the fastest
input promise settles. A very common use is implementing a timeout around
a slow operation, as shown above.

### `Promise.any` — first success wins, ignores rejections

```js
Promise.any([fetchFromMirror1(), fetchFromMirror2(), fetchFromMirror3()])
  .then((firstSuccess) => console.log("Fastest successful mirror:", firstSuccess))
  .catch((aggregateError) => {
    // only rejects if ALL of them reject
    console.error("Every mirror failed:", aggregateError.errors);
  });
```

`Promise.any` is the fulfillment-focused sibling of `Promise.race` — it
ignores rejections and only settles (rejects) if *every* input promise
rejects, bundling all the individual errors into an `AggregateError`.

## 22.6 Promisifying callback-based APIs

Older Node.js APIs and many libraries still use error-first callbacks.
"Promisifying" wraps such a function so it returns a promise instead,
letting it participate in modern promise chains and, eventually,
`async`/`await`.

```js
function readFileCallback(path, callback) {
  // pretend this is fs.readFile
  setTimeout(() => {
    if (path === "missing.txt") {
      callback(new Error("ENOENT: no such file"));
    } else {
      callback(null, "file contents for " + path);
    }
  }, 10);
}

function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    readFileCallback(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

readFilePromise("notes.txt")
  .then((data) => console.log("Read:", data))
  .catch((err) => console.error("Failed:", err.message));
```

Node.js also ships a built-in helper for exactly this pattern:
`util.promisify(fn)`, which works automatically for any function that
follows the standard `(err, result) => {}` callback signature.

```js
const util = require("util");
const promisifiedReadFile = util.promisify(readFileCallback);
promisifiedReadFile("notes.txt").then(console.log);
```

## 22.7 The Promise constructor antipattern

A frequent mistake, especially among developers new to promises, is
wrapping something that is *already a promise* in a new, unnecessary
`Promise` constructor:

```js
// ANTIPATTERN — don't do this
function getUser(id) {
  return new Promise((resolve, reject) => {
    fetchUser(id) // fetchUser already returns a promise!
      .then((user) => resolve(user))
      .catch((err) => reject(err));
  });
}

// CORRECT — fetchUser already returns a promise, just return it
function getUser(id) {
  return fetchUser(id);
}
```

If you already have a promise, return it directly (or chain `.then` onto
it and return that). Only reach for `new Promise(...)` when you're
wrapping something that is **not** already promise-based — a raw callback
API, a `setTimeout`, or an event emitter.

## 22.8 Unhandled promise rejections

If a promise rejects and nothing ever attaches a `.catch` (or the rejected
branch of a `.then`) to it, JavaScript considers this an **unhandled
promise rejection**. In Node.js, this prints a warning to `stderr` and, in
recent versions, can crash the process entirely; in browsers, it logs to
the console and fires an `unhandledrejection` event on `window`.

```js
function riskyOperation() {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Something broke")), 10);
  });
}

riskyOperation(); // BUG: no .catch anywhere — this rejection goes unhandled
```

The fix is simple but easy to forget in a large codebase: **every promise
chain needs a `.catch` somewhere**, or must eventually be `await`-ed inside
a `try`/`catch` (Chapter 23). As a safety net, you can also listen
globally:

```js
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection:", reason);
});
```

Treat this global listener as a last-resort logging net, not a substitute
for handling errors where they occur.

## 22.9 Chapter summary

- A promise represents a future value with three states: pending,
  fulfilled, or rejected; once settled, it never changes again.
- `.then`/`.catch`/`.finally` consume a promise and each return a *new*
  promise, enabling chaining.
- Always `return` a value or promise from inside a `.then` callback if the
  next step in the chain should wait for it.
- `Promise.all` (fail-fast, all results), `Promise.allSettled` (never
  fails, all outcomes), `Promise.race` (first to settle), and
  `Promise.any` (first success) each coordinate multiple promises
  differently — pick based on what "done" means for your use case.
- `util.promisify` (or a hand-written wrapper) converts error-first
  callback APIs into promise-returning ones.
- Avoid the `new Promise` antipattern when you already have a promise to
  return.
- Every promise chain needs error handling, or you risk an unhandled
  rejection.

## 22.10 Exercises

1. Run `examples/22-promises.js` and read the output for the
   `Promise.all` vs `Promise.allSettled` section. Change one of the mock
   fetches to reject and observe how each combinator's output changes.
2. Find the "forgot to return" bug that's deliberately included in
   `demonstrateReturnBug()` in the example file, fix it, and confirm the
   corrected chain now logs the expected order-of-completion message.
3. Write a `withTimeout(promise, ms)` helper using `Promise.race` that
   rejects with a `"Timed out"` error if `promise` doesn't settle within
   `ms` milliseconds. Test it against a mock fetch that takes longer than
   the timeout.
