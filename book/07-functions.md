# Chapter 7 — Functions

## 7.1 Three ways to write a function

```js
// Function declaration
function add(a, b) {
  return a + b;
}

// Function expression (anonymous, assigned to a variable)
const subtract = function (a, b) {
  return a - b;
};

// Named function expression (name only visible inside its own body, useful for recursion/stack traces)
const multiply = function multiplyImpl(a, b) {
  return a - 1 === 0 ? a : a * multiplyImpl(a - 1, b); // silly example just to show self-reference
};

// Arrow function (ES6)
const divide = (a, b) => a / b;
```

These are not just stylistic variants — they differ in **hoisting**,
**`this` binding**, and **the `arguments` object**, all covered below.

## 7.2 Parameters, arguments, return values

```js
function greet(name) {
  return `Hello, ${name}`;
}
console.log(greet("Alice")); // "Hello, Alice"

// Calling with too few/many arguments never throws in JavaScript —
// missing parameters are simply undefined, extra arguments are ignored
// (unless you use the arguments object or rest parameters to access them):
console.log(greet());              // "Hello, undefined"
console.log(greet("Alice", "Bob")); // "Hello, Alice" -- "Bob" is silently dropped

function noReturn() {
  console.log("did something");
}
console.log(noReturn()); // undefined -- functions without a `return` return undefined
```

## 7.3 Default parameters (ES6)

```js
function greetWithDefault(name = "Guest") {
  return `Hello, ${name}`;
}
console.log(greetWithDefault());          // "Hello, Guest"
console.log(greetWithDefault(undefined)); // "Hello, Guest" -- undefined triggers the default
console.log(greetWithDefault(null));      // "Hello, null"  -- null does NOT trigger the default!
console.log(greetWithDefault("Bob"));     // "Hello, Bob"

// Defaults can reference earlier parameters:
function makeRange(start, end = start + 10) {
  return [start, end];
}
console.log(makeRange(5)); // [5, 15]
```

**Only `undefined` triggers a default parameter — `null` is treated as an
explicit, deliberate value.** This is the same rule nullish coalescing
(`??`) follows, and it's intentional consistency in the language.

## 7.4 Rest parameters

The rest parameter (`...args`) collects any number of trailing arguments
into a real array:

```js
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
console.log(sum(1, 2, 3));       // 6
console.log(sum(1, 2, 3, 4, 5)); // 15
console.log(sum());               // 0

function logFirstAndRest(first, ...rest) {
  console.log("first:", first, "rest:", rest);
}
logFirstAndRest(1, 2, 3, 4); // first: 1 rest: [ 2, 3, 4 ]
```

Rest must be the **last** parameter — `function f(...a, b) {}` is a
syntax error.

## 7.5 The `arguments` object

Every regular function (not arrow functions) has access to an
array-like `arguments` object containing all passed arguments,
regardless of the declared parameters:

```js
function showArgs() {
  console.log(arguments);        // Arguments(3) [1, 2, 3]
  console.log(arguments.length); // 3
  console.log(arguments[0]);     // 1
}
showArgs(1, 2, 3);
```

`arguments` is **array-like, not a real array** — it has indices and
`.length`, but not `.map()`, `.filter()`, etc. directly:

```js
function showArgsArray() {
  // arguments.map(x => x * 2); // TypeError: arguments.map is not a function
  const realArray = Array.from(arguments); // or [...arguments]
  return realArray.map((x) => x * 2);
}
console.log(showArgsArray(1, 2, 3)); // [2, 4, 6]
```

**Rest parameters are the modern replacement for `arguments`** — they
give you a real array directly and work in arrow functions (where
`arguments` doesn't exist at all — see 7.6). Prefer `...args` in new code.

## 7.6 Arrow functions: the real differences

Arrow functions aren't just shorter syntax. They differ from regular
functions in three fundamental ways:

### 1. No own `this` — arrows inherit `this` from their enclosing scope

```js
const obj = {
  name: "Timer",
  startRegular: function () {
    setTimeout(function () {
      console.log("regular function this.name:", this?.name); // undefined -- `this` is lost
    }, 0);
  },
  startArrow: function () {
    setTimeout(() => {
      console.log("arrow function this.name:", this.name); // "Timer" -- inherits `this` from startArrow
    }, 0);
  },
};
obj.startRegular();
obj.startArrow();
```

This is *the* main reason arrow functions exist and the main reason to
choose one over a regular function — full explanation in Chapter 15.

### 2. No `arguments` object

```js
const arrowNoArgs = () => {
  // console.log(arguments); // ReferenceError (in a module) or refers to an OUTER
  //                          // function's `arguments` if nested inside one
};
```

Use rest parameters (`...args`) in arrow functions instead.

### 3. Cannot be used as a constructor

```js
const Person = (name) => { this.name = name; };
// new Person("Alice"); // TypeError: Person is not a constructor
```

Arrow functions have no internal `[[Construct]]` behavior — `new` simply
doesn't work on them. Use a regular function or a `class` (Chapter 17)
when you need something instantiable with `new`.

### Arrow function syntax shortcuts

```js
const square = (x) => x * x;              // implicit return, no braces needed
const add2 = (a, b) => a + b;              // multiple params still need parens
const noop = () => {};                      // empty body, explicit return undefined
const makeObj = () => ({ key: "value" });    // parens needed to return an object literal directly
                                               // (otherwise {} is parsed as a function BODY, not an object)
const identity = (x) => x;                     // single param, parens optional: x => x also valid
```

## 7.7 Function hoisting

```js
console.log(hoisted()); // "I work!" -- function declarations are FULLY hoisted (body included)
function hoisted() {
  return "I work!";
}

// console.log(notHoisted()); // TypeError: notHoisted is not a function
var notHoisted = function () {
  return "I don't work yet";
};
// (var is hoisted as undefined; the assignment only happens at this line)
```

## 7.8 Immediately Invoked Function Expressions (IIFEs)

An IIFE runs a function the instant it's defined, creating a private
scope. Before ES6 modules and `let`/`const` block scoping existed, this
was the standard way to avoid polluting the global scope:

```js
(function () {
  const privateVar = "not visible outside";
  console.log("IIFE ran:", privateVar);
})();

// Arrow function IIFE
(() => {
  console.log("arrow IIFE ran");
})();

// IIFEs that return a value (the "module pattern")
const counter = (function () {
  let count = 0;
  return {
    increment: () => ++count,
    reset: () => (count = 0),
  };
})();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.reset());      // 0
```

IIFEs are less common today (ES modules give every file its own scope
automatically — Chapter 24), but you'll still see them in bundled
library code and older codebases, and the module pattern above is a
direct ancestor of the closure-based patterns in Chapter 14.

## 7.9 First-class functions

In JavaScript, functions are **values** — they can be stored in
variables, passed as arguments, returned from other functions, and stored
in data structures, exactly like numbers or strings. This is called
"functions as first-class citizens" and it's the foundation of callbacks,
array methods (Chapter 19), and much of JavaScript's expressive power.

```js
// Stored in a variable — already shown throughout this chapter

// Passed as an argument ("callback")
function processArray(arr, callback) {
  const result = [];
  for (const item of arr) {
    result.push(callback(item));
  }
  return result;
}
console.log(processArray([1, 2, 3], (x) => x * 10)); // [10, 20, 30]

// Returned from a function ("higher-order function," full chapter: 19)
function makeMultiplier(factor) {
  return function (x) {
    return x * factor;
  };
}
const triple = makeMultiplier(3);
console.log(triple(7)); // 21

// Stored in a data structure
const operations = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};
console.log(operations["add"](2, 3)); // 5
```

## 7.10 Pure functions vs. side effects

A **pure function** always returns the same output for the same input and
causes no observable side effects (no mutating external state, no I/O, no
relying on anything outside its parameters):

```js
// Pure — same input always gives same output, touches nothing outside itself
function addPure(a, b) {
  return a + b;
}

// Impure — depends on external mutable state
let taxRate = 0.1;
function addTaxImpure(price) {
  return price + price * taxRate; // result changes if taxRate changes elsewhere
}

// Impure — mutates its argument (a side effect visible to the caller)
function addItemImpure(cart, item) {
  cart.push(item); // mutates the array the caller passed in
  return cart;
}

// Pure equivalent — returns a new array instead of mutating
function addItemPure(cart, item) {
  return [...cart, item];
}
```

Pure functions are easier to test (no setup/mocking needed), easier to
reason about (no hidden dependencies), safe to run in any order or in
parallel, and are the foundation of predictable state management in UI
frameworks like React. You won't write 100% pure code in practice — I/O,
logging, and DOM updates are inherently side effects — but **isolating
your side effects at the edges of your program, and keeping the core
logic pure, is one of the most valuable habits in software engineering.**

## 7.11 Recursion

A function that calls itself, with a **base case** that stops the
recursion:

```js
function factorial(n) {
  if (n <= 1) return 1;      // base case
  return n * factorial(n - 1); // recursive case
}
console.log(factorial(5)); // 120

function fibonacci(n) {
  if (n <= 1) return n; // base case
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10)); // 55
// Warning: this naive version is exponential time — recomputes the same
// values repeatedly. Chapter 19 covers memoization to fix this.

// Recursion is natural for tree-shaped data:
function sumNestedArray(arr) {
  let total = 0;
  for (const item of arr) {
    total += Array.isArray(item) ? sumNestedArray(item) : item;
  }
  return total;
}
console.log(sumNestedArray([1, [2, 3], [4, [5, 6]]])); // 21
```

Every recursive call adds a frame to the **call stack**. Too many levels
of recursion without a base case (or with a base case that's never
reached) throws `RangeError: Maximum call stack size exceeded`:

```js
function infiniteRecursion() {
  return infiniteRecursion(); // no base case!
}
// infiniteRecursion(); // RangeError: Maximum call stack size exceeded
```

Unlike some languages, standard JavaScript engines do **not** guarantee
tail-call optimization in practice (it's in the ES6 spec but essentially
unimplemented in V8), so deep recursion (tens of thousands of levels) on
large inputs is a real risk — an iterative loop is often safer for
unbounded-depth problems.

## 7.12 Chapter summary

- Function declarations are fully hoisted; function expressions follow
  the hoisting rules of the variable they're assigned to.
- Default parameters trigger only on `undefined`, not `null`; rest
  parameters (`...args`) collect trailing arguments into a real array and
  are the modern replacement for the array-like `arguments` object.
- Arrow functions differ from regular functions in three real ways: they
  inherit `this` from their enclosing scope, have no `arguments` object,
  and cannot be used as constructors.
- Functions are first-class values in JavaScript — they can be stored,
  passed, and returned like any other value, enabling callbacks and
  higher-order functions.
- Pure functions (same input → same output, no side effects) are easier
  to test and reason about; isolate side effects where you can.
- Recursive functions need a reachable base case; JavaScript engines
  generally don't optimize tail calls, so very deep recursion can
  overflow the call stack.

## 7.13 Exercises

1. Write `makeAdder(x)` that returns a function adding `x` to whatever
   it's called with, so `makeAdder(5)(3)` returns `8`.
2. Convert this function to an arrow function and explain, in a comment,
   whether the conversion changes its behavior when used as an object
   method: `function sayName() { return this.name; }`.
3. Write a recursive function `flattenDeep(arr)` that flattens an
   arbitrarily nested array (like the `sumNestedArray` example, but
   returning a flat array instead of a sum).
