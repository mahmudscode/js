# Chapter 19 — Higher-Order Functions & Functional Programming

## 19.1 Functions as first-class values

In JavaScript, functions are **first-class values**: they can be stored in
variables, put inside arrays or objects, passed as arguments to other
functions, and returned from other functions — exactly like a number or a
string. This single fact underlies closures (Chapter 14), callbacks
(Chapter 21), array methods (Chapter 8), and most of the functional
programming techniques in this chapter.

```js
const square = function (x) {
  return x * x;
};

const operations = {
  double: (x) => x * 2,
  square,
};

const functionList = [square, operations.double];

console.log(operations.square(5)); // 25
console.log(functionList[1](5));   // 10
```

## 19.2 Higher-order functions defined

A **higher-order function** is any function that does at least one of:

1. **takes another function as an argument**, or
2. **returns a function as its result**.

You've already been using higher-order functions throughout this book —
`array.map(fn)`, `array.filter(fn)`, `setTimeout(fn, ms)`, and the
`makeCounter()`/`memoize()` closures from Chapter 14 are all higher-order
functions.

```js
function withLogging(fn) {
  // takes a function, returns a NEW function that wraps it — higher-order twice over
  return function (...args) {
    console.log(`Calling ${fn.name} with`, args);
    const result = fn(...args);
    console.log(`${fn.name} returned`, result);
    return result;
  };
}

function add(a, b) {
  return a + b;
}

const loggedAdd = withLogging(add);
loggedAdd(2, 3);
// Calling add with [ 2, 3 ]
// add returned 5
```

## 19.3 `map`, `filter`, `reduce` as a functional toolkit

Chapter 8 introduced these as array methods; here we look at them through
a functional lens: each one replaces an imperative loop pattern with a
declarative statement of *intent*.

```js
const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

// Imperative: describes HOW (a loop, a mutable accumulator)
const evensImperative = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) evensImperative.push(numbers[i]);
}

// Declarative: describes WHAT (filter down to evens)
const evensDeclarative = numbers.filter((n) => n % 2 === 0);

console.log(evensImperative, evensDeclarative); // same result, different style

// A real pipeline: filter -> transform -> aggregate, each step named and testable
const sumOfSquaresOfEvens = numbers
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .reduce((total, n) => total + n, 0);

console.log(sumOfSquaresOfEvens); // 4 + 16 + 36 + 64 = 120
```

`reduce` is the most general of the three — `map` and `filter` can both be
implemented *in terms of* `reduce`, which is a useful exercise for
understanding what "higher-order" really buys you:

```js
function myMap(array, fn) {
  return array.reduce((acc, item) => {
    acc.push(fn(item));
    return acc;
  }, []);
}
function myFilter(array, predicate) {
  return array.reduce((acc, item) => {
    if (predicate(item)) acc.push(item);
    return acc;
  }, []);
}
console.log(myMap([1, 2, 3], (n) => n * 10));       // [10, 20, 30]
console.log(myFilter([1, 2, 3, 4], (n) => n > 2));  // [3, 4]
```

## 19.4 Function composition

**Composition** means building a complex operation by chaining together
small, single-purpose functions, where each function's output becomes the
next function's input. This is the functional equivalent of Unix pipes.

```js
const compose = (...fns) =>
  (initialValue) =>
    fns.reduceRight((value, fn) => fn(value), initialValue);

const pipe = (...fns) =>
  (initialValue) =>
    fns.reduce((value, fn) => fn(value), initialValue);

const trim = (s) => s.trim();
const toLowerCase = (s) => s.toLowerCase();
const removeSpaces = (s) => s.replace(/\s+/g, "-");

const slugify = pipe(trim, toLowerCase, removeSpaces);
console.log(slugify("  Hello World  ")); // "hello-world"

// compose() applies right-to-left, pipe() applies left-to-right — same
// functions, opposite reading order. Most developers find pipe() more
// intuitive because it reads top-to-bottom like the steps happen.
const slugifyComposed = compose(removeSpaces, toLowerCase, trim);
console.log(slugifyComposed("  Hello World  ")); // "hello-world" — same result
```

## 19.5 Currying and partial application

**Currying** transforms a function that takes multiple arguments into a
sequence of functions that each take a single argument. **Partial
application** is the related (but distinct) technique of fixing some
arguments of a function ahead of time, producing a new function that only
needs the rest.

```js
// A normal multi-argument function
function add3(a, b, c) {
  return a + b + c;
}

// Manually curried version
function curriedAdd3(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}
console.log(curriedAdd3(1)(2)(3)); // 6

// The same thing, written with arrow functions (much more common in practice)
const curriedAdd3Arrow = (a) => (b) => (c) => a + b + c;
console.log(curriedAdd3Arrow(1)(2)(3)); // 6

// A generic curry() helper that can curry ANY function
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args); // fn.length = number of declared (non-rest) parameters
    }
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

const curriedAdd = curry(add3);
console.log(curriedAdd(1)(2)(3));    // 6 — fully curried, one arg at a time
console.log(curriedAdd(1, 2)(3));    // 6 — partial application works too
console.log(curriedAdd(1, 2, 3));    // 6 — calling with all args at once still works
```

Currying is especially useful for creating specialized functions from
general ones:

```js
const multiply = (a, b) => a * b;
const curriedMultiply = curry(multiply);
const double = curriedMultiply(2); // "freeze" the first argument as 2
const triple = curriedMultiply(3);
console.log(double(5), triple(5)); // 10 15
```

## 19.6 Pure functions and immutability

A **pure function** has two properties:

1. Given the same inputs, it **always returns the same output**.
2. It has **no side effects** — it doesn't mutate its arguments, doesn't
   touch external/global state, doesn't perform I/O.

```js
// Impure: depends on external state, and mutates its argument
let taxRate = 0.08;
function addTaxImpure(cart) {
  cart.total = cart.total * (1 + taxRate); // mutates the input object!
  return cart.total;
}

// Pure: same inputs always give same output, no mutation, no external reads
function addTaxPure(total, rate) {
  return total * (1 + rate);
}

const cart = { total: 100 };
console.log(addTaxPure(cart.total, 0.08)); // 108 — cart itself is untouched
console.log(cart.total);                    // still 100
```

Pure functions are trivially testable (no setup/mocking of external state
needed), safely cacheable (Chapter 14's `memoize`), and safe to run in any
order or in parallel, since they can't interfere with anything outside
themselves. Real programs can't be *entirely* pure — something eventually
has to touch the DOM, write to a database, or log to a console — but
pushing as much logic as possible into pure functions, and concentrating
side effects into a small, clearly identified layer, is a widely used
professional discipline (sometimes summarized as "functional core,
imperative shell").

Immutability — not mutating data, but creating new copies with changes
applied — is the natural companion practice:

```js
// Mutating (avoid for shared/external state):
function addItemMutating(cart, item) {
  cart.items.push(item); // mutates the original array in place
  return cart;
}

// Immutable (safer, easier to reason about):
function addItemImmutable(cart, item) {
  return {
    ...cart,
    items: [...cart.items, item], // new array, original untouched
  };
}

const cartA = { items: ["apple"] };
const cartB = addItemImmutable(cartA, "banana");
console.log(cartA.items); // ["apple"] — unchanged
console.log(cartB.items); // ["apple", "banana"] — new object
```

## 19.7 An honest comparison: imperative vs. functional style in JS

JavaScript is a **multi-paradigm** language — it doesn't force you into
either imperative or functional style, and idiomatic JS code usually mixes
both pragmatically:

```js
// Same task, three styles:
const users = [
  { name: "Ada", active: true },
  { name: "Grace", active: false },
  { name: "Alan", active: true },
];

// Imperative
const activeNamesImperative = [];
for (const user of users) {
  if (user.active) activeNamesImperative.push(user.name);
}

// Functional
const activeNamesFunctional = users
  .filter((u) => u.active)
  .map((u) => u.name);

console.log(activeNamesImperative); // ["Ada", "Alan"]
console.log(activeNamesFunctional); // ["Ada", "Alan"]
```

Neither style is universally "better." The functional/chained version
reads clearly as a pipeline of transformations and avoids a mutable
accumulator variable, which many developers find easier to reason about.
The imperative version can be more efficient for very large datasets or
complex control flow with early exits (`break`), since chained array
methods create intermediate arrays at each step (`.filter()` allocates a
whole new array before `.map()` even starts) — a tradeoff revisited in
Chapter 34's performance discussion. Good JavaScript developers read both
fluently and choose deliberately, rather than treating either style as a
rule to follow blindly.

## 19.8 Chapter summary

- Functions are first-class values in JavaScript — they can be stored,
  passed, and returned like any other value.
- A higher-order function takes a function as an argument, returns a
  function, or both. `map`/`filter`/`reduce`, `setTimeout`, and closures
  from Chapter 14 are all higher-order functions in practice.
- `map` and `filter` can both be expressed in terms of `reduce`, the most
  general of the three.
- Composition (`pipe`/`compose`) chains small functions into pipelines;
  `pipe` applies left-to-right, `compose` applies right-to-left.
- Currying transforms a multi-argument function into a chain of
  single-argument functions; partial application fixes some arguments
  ahead of time.
- Pure functions (same input → same output, no side effects) are easier to
  test, cache, and reason about; immutability (copy-with-changes instead
  of mutate-in-place) is their natural companion practice.
- JavaScript is multi-paradigm — choose imperative or functional style
  deliberately based on clarity and performance needs, not dogma.

## 19.9 Exercises

1. Implement `myReduce(array, fn, initialValue)` from scratch using only a
   `for` loop (i.e., without calling the built-in `.reduce`).
2. Write a curried `between(min)(max)(value)` function that returns `true`
   if `value` is within `[min, max]` inclusive, then use `curry()` from
   this chapter on an uncurried three-argument version to prove it's
   equivalent.
3. Identify why the `addTaxImpure` function from 19.6 would give different
   test results depending on when a test runs, and rewrite it to be pure.
