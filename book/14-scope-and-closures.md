# Chapter 14 — Scope and Closures

## 14.1 What is scope?

Scope answers one question: *from this line of code, which variables can I
see?* Every variable you declare lives inside a scope, and JavaScript
decides which scope a variable belongs to at the moment you write the
code — not at the moment it runs. That property is called **lexical
scoping** (or static scoping), and it's the foundation for everything in
this chapter.

JavaScript has three kinds of scope:

- **Global scope** — variables declared outside any function or block.
  Visible everywhere in the program.
- **Function scope** — variables declared with `var` inside a function are
  visible anywhere in that function, regardless of nested blocks.
- **Block scope** — variables declared with `let` or `const` inside `{ }`
  (an `if`, `for`, `while`, or bare block) are visible only inside that
  block.

```js
var globalVar = "I'm global";

function outer() {
  var functionScoped = "I'm function-scoped";

  if (true) {
    let blockScoped = "I'm block-scoped";
    var stillFunctionScoped = "var ignores the if-block";
    console.log(blockScoped); // fine, we're inside the block
  }

  console.log(functionScoped);       // fine
  console.log(stillFunctionScoped);  // fine — var leaked out of the if
  console.log(typeof blockScoped);   // "undefined" — out of scope, not visible
}
```

The single most important practical rule in this chapter: **`var` is
function-scoped, `let` and `const` are block-scoped.** This difference
explains most of the "weird" bugs you'll hit with `var`, and it's why
modern JavaScript style guides tell you to never use `var`.

## 14.2 The scope chain

When JavaScript looks up a variable, it doesn't just check the current
scope — it walks *outward* through each enclosing scope until it finds the
variable or runs out of scopes (at which point you get a
`ReferenceError`). This chain of nested scopes is the **scope chain**.

```js
const a = "global a";

function outer() {
  const b = "outer b";

  function inner() {
    const c = "inner c";
    console.log(a, b, c); // "global a" "outer b" "inner c"
    // inner() can see a, b, and c because it looks outward through
    // its own scope -> outer's scope -> global scope.
  }

  inner();
  console.log(typeof c); // "undefined" — outer() cannot see inner's c.
                          // Scope only looks OUTWARD, never inward.
}

outer();
```

The rule to memorize: **inner scopes can see outer variables, but outer
scopes can never see inner variables.** Scope is a one-way mirror, and it's
determined entirely by *where you physically wrote the code* — not by
which function called which. This is what "lexical" means: fixed by the
text (the "lexicon") of the program, not by the runtime call path.

## 14.3 Hoisting, precisely

"Hoisting" is the term for JavaScript's behavior of processing declarations
before running any code in a scope. It is often explained as "declarations
are moved to the top," which is a useful lie for beginners but not
accurate enough for real debugging. Here's what actually happens: before
executing a scope, the engine scans it and registers every declaration
(`var`, `let`, `const`, `function`, `class`) in that scope's environment —
but *how* each kind of declaration is initialized differs.

### `var` — hoisted and initialized to `undefined`

```js
console.log(myVar); // undefined (not a ReferenceError!)
var myVar = 5;
console.log(myVar); // 5
```

The declaration `var myVar` is hoisted to the top of the function/global
scope and immediately initialized to `undefined`. The assignment
`myVar = 5` stays exactly where you wrote it. This is why reading a `var`
before its assignment gives `undefined` instead of crashing.

### Function declarations — hoisted with their full body

```js
sayHi(); // "Hi!" — works, because the whole function is hoisted

function sayHi() {
  console.log("Hi!");
}
```

Function declarations (`function name() {}`) are hoisted completely,
including their body, so you can call them before their textual position.

### `let` and `const` — hoisted but NOT initialized (the Temporal Dead Zone)

```js
console.log(myLet); // ReferenceError: Cannot access 'myLet' before initialization
let myLet = 5;
```

`let` and `const` *are* hoisted — the engine knows about them before this
line runs — but they are not given a value. The span between the start of
the scope and the line where the `let`/`const` is declared is called the
**Temporal Dead Zone (TDZ)**. Accessing the variable anywhere in the TDZ
throws a `ReferenceError`, which is JavaScript intentionally failing loudly
instead of silently giving you `undefined`. This is one of the practical
reasons `let`/`const` are safer than `var`: they turn "used before
declared" from a silent bug into a crash you notice immediately.

### Function expressions and arrow functions — follow their variable's rule

```js
sayBye(); // TypeError: sayBye is not a function (var hoisted as undefined)
var sayBye = function () {
  console.log("Bye!");
};

sayYo(); // ReferenceError: Cannot access 'sayYo' before initialization
const sayYo = () => console.log("Yo!");
```

A function *expression* assigned to a `var`/`let`/`const` is hoisted only
as far as its variable declaration rule allows — the function body itself
is not hoisted, only the variable binding. This trips up a lot of
developers who assume "it's a function, so it must hoist like a function
declaration."

| Declaration | Hoisted? | Initial value | Accessing before declaration |
|---|---|---|---|
| `var x` | Yes | `undefined` | Returns `undefined` |
| `let x` / `const x` | Yes (binding only) | Uninitialized (TDZ) | `ReferenceError` |
| `function f(){}` | Yes, fully | The function itself | Works normally |
| `const f = () => {}` | Yes (binding only) | Uninitialized (TDZ) | `ReferenceError` |

## 14.4 Closures: the definition that actually matters

A **closure** is what happens when a function "remembers" the variables
from the scope it was defined in, even after that outer scope has finished
executing. Every function in JavaScript forms a closure over its lexical
scope — this isn't a special feature you opt into, it's just how scope
chains work combined with functions being first-class values that can be
returned or passed around.

```js
function makeCounter() {
  let count = 0; // this variable lives inside makeCounter's scope

  return function increment() {
    count++; // increment "closes over" count
    return count;
  };
}

const counter1 = makeCounter();
const counter2 = makeCounter();

console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter1()); // 3
console.log(counter2()); // 1 — counter2 has its OWN closure over its OWN count
```

Even though `makeCounter()` has already returned and its call-stack frame
is long gone, the returned `increment` function still has access to
`count`. The JavaScript engine keeps `count` alive in memory precisely
*because* a live function still references it — this is a form of garbage
collection awareness that's useful to understand: **closures keep their
captured variables alive for as long as the closure itself is reachable.**
This is powerful, but it also means closures can accidentally cause memory
to be retained longer than you expect if you're not careful (e.g., a
closure capturing a huge array that's never needed again).

### Closures for private state

Before JavaScript had private class fields (`#field`, Chapter 17),
closures were *the* way to create private variables:

```js
function createBankAccount(initialBalance) {
  let balance = initialBalance; // not accessible from outside directly

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createBankAccount(100);
console.log(account.getBalance()); // 100
account.deposit(50);
console.log(account.getBalance()); // 150
console.log(account.balance);      // undefined — truly private, no back door
```

There is no way to reach into `account` and directly read or set `balance`
except through the methods that closure exposes. This pattern is called
the **module pattern**, and it's the ancestor of ES modules (Chapter 24).

### Closures for memoization

```js
function memoize(fn) {
  const cache = new Map(); // captured by the returned function

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log("cache hit for", key);
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

function slowSquare(n) {
  for (let i = 0; i < 1e8; i++) {} // pretend this is expensive
  return n * n;
}

const fastSquare = memoize(slowSquare);
fastSquare(5); // computes, slow
fastSquare(5); // cache hit, instant
```

## 14.5 The classic `var` + loop + `setTimeout` bug

This single example explains why `let` was added to the language and why
"just use `let`" is such common advice.

```js
// The bug
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log("var i:", i);
  }, 100);
}
// Output (after ~100ms):
// var i: 3
// var i: 3
// var i: 3
```

Why? `var i` is function/global-scoped — there is only **one** `i` for the
entire loop. All three `setTimeout` callbacks close over the *same* `i`
variable. By the time any of them actually runs (100ms later, after the
loop has already finished all three iterations), `i` is `3`.

```js
// The fix: let
for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log("let i:", i);
  }, 100);
}
// Output:
// let i: 0
// let i: 1
// let i: 2
```

With `let`, the specification says each iteration of a `for` loop gets a
**fresh binding** of `i`, copied from the previous iteration's value. Each
`setTimeout` callback closes over its own separate `i`, so the values are
preserved correctly.

Before `let` existed, developers fixed this with an **IIFE (Immediately
Invoked Function Expression)** to manually create a new scope per
iteration:

```js
// The old-school fix: IIFE
for (var i = 0; i < 3; i++) {
  (function (capturedI) {
    setTimeout(function () {
      console.log("IIFE i:", capturedI);
    }, 100);
  })(i); // pass the CURRENT value of i in immediately
}
// Output: IIFE i: 0 / IIFE i: 1 / IIFE i: 2
```

Understanding both the bug and both fixes is a strong signal of real
JavaScript fluency — it's one of the most common interview questions for a
reason.

## 14.6 Nested closures and shared state

Multiple functions defined in the same scope share closures over the same
variables — they don't each get their own copy:

```js
function createToggle() {
  let isOn = false;

  return {
    toggle() {
      isOn = !isOn;
      return isOn;
    },
    status() {
      return isOn ? "ON" : "OFF";
    },
  };
}

const light = createToggle();
console.log(light.status()); // OFF
light.toggle();
console.log(light.status()); // ON — toggle() and status() share the same isOn
```

`toggle` and `status` are two different functions, but they both close
over the *same* `isOn` variable, so changes made by one are visible to the
other. This is exactly how a JavaScript module keeps internal state that
multiple exported functions can read and mutate.

## 14.7 Chapter summary

- Scope determines variable visibility and is resolved lexically — by
  where code is *written*, not by how it's called.
- `var` is function-scoped; `let`/`const` are block-scoped. Prefer
  `let`/`const` always.
- All declarations are hoisted, but only `var` and function declarations
  get a usable value immediately; `let`/`const` sit in the Temporal Dead
  Zone until their line executes.
- A closure is a function bundled with a reference to its lexical scope —
  every function forms one automatically. Closures let variables outlive
  the function call that created them.
- Closures enable private state (module pattern), memoization, and
  callback factories, but can also retain memory if not managed carefully.
- The classic `var`-in-a-loop bug is caused by all iterations sharing one
  variable; `let` fixes it by giving each iteration its own binding.

## 14.8 Exercises

1. Predict the output before running: what does each `console.log` print
   in a loop using `var j` versus `let j` combined with `setTimeout`?
2. Write a `createIdGenerator()` function using a closure that returns a
   function which produces a new incrementing ID (`1`, `2`, `3`, ...) every
   time it's called, starting fresh for each generator instance.
3. Explain in your own words why `let x; console.log(x);` prints
   `undefined` at the top of a script, while
   `console.log(x); let x;` throws a `ReferenceError`.
