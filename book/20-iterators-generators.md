# Chapter 20 — Iterators and Generators

## 20.1 What makes something "iterable"

In Chapter 6 you used `for...of` on arrays, strings, `Map`, and `Set`
without asking *why* it worked on those but not on plain objects. The
answer is the **iterable protocol**: any object that implements a method
named `Symbol.iterator` (a well-known Symbol — see Chapter 3.6) which
returns an **iterator** can be used with `for...of`, spread (`...`),
destructuring, and `Array.from()`.

An **iterator** is any object with a `.next()` method that returns
`{ value, done }`:

```js
const numbers = [10, 20, 30];
const iterator = numbers[Symbol.iterator](); // arrays have a built-in iterator

console.log(iterator.next()); // { value: 10, done: false }
console.log(iterator.next()); // { value: 20, done: false }
console.log(iterator.next()); // { value: 30, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

`for...of` is essentially sugar for calling `.next()` repeatedly until
`done` is `true`:

```js
function forOfEquivalent(iterable) {
  const it = iterable[Symbol.iterator]();
  let result = it.next();
  while (!result.done) {
    console.log(result.value);
    result = it.next();
  }
}
forOfEquivalent([1, 2, 3]); // 1, 2, 3
```

Plain objects (`{}`) don't implement `Symbol.iterator` by default, which
is exactly why `for...of` throws `TypeError: obj is not iterable` on a
plain object, while `for...in` (Chapter 6.4, key-based, not the iterator
protocol) works fine.

## 20.2 Building a custom iterable

You can make any object work with `for...of` by implementing
`Symbol.iterator` yourself:

```js
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

for (const n of range) {
  console.log(n); // 1, 2, 3, 4, 5
}
console.log([...range]); // [1, 2, 3, 4, 5] -- spread also uses the iterable protocol
console.log(Array.from(range)); // same result, different syntax
```

This manual pattern — tracking state in closure variables, returning an
object with `.next()` — works, but it's verbose and easy to get subtly
wrong (as the next section shows). **Generators** exist to make exactly
this pattern trivial to write correctly.

## 20.3 Generator functions

A **generator function** (declared with `function*`) is a function that
can pause and resume its own execution using the `yield` keyword. Calling
a generator function doesn't run its body immediately — it returns a
**generator object**, which is both an iterator *and* an iterable:

```js
function* simpleGenerator() {
  console.log("start");
  yield 1;
  console.log("resumed after first yield");
  yield 2;
  console.log("resumed after second yield");
  yield 3;
  console.log("generator finished");
}

const gen = simpleGenerator(); // nothing logs yet -- the body hasn't run
console.log(gen.next()); // logs "start", then returns { value: 1, done: false }
console.log(gen.next()); // logs "resumed after first yield", returns { value: 2, done: false }
console.log(gen.next()); // logs "resumed after second yield", returns { value: 3, done: false }
console.log(gen.next()); // logs "generator finished", returns { value: undefined, done: true }
```

Because generators implement `Symbol.iterator` automatically, they work
directly with `for...of` and spread:

```js
function* countTo(n) {
  for (let i = 1; i <= n; i++) {
    yield i;
  }
}
for (const n of countTo(5)) {
  console.log(n); // 1, 2, 3, 4, 5
}
console.log([...countTo(3)]); // [1, 2, 3]
```

The `range` example from 20.2, rewritten as a generator, is far shorter
and impossible to get the `done`/`value` bookkeeping wrong on:

```js
function* range(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}
console.log([...range(1, 5)]); // [1, 2, 3, 4, 5]
```

## 20.4 Passing values into a generator

`.next(value)` can send a value *into* the generator, which becomes the
result of the `yield` expression that was paused:

```js
function* conversation() {
  const name = yield "What's your name?";
  const age = yield `Hi ${name}, how old are you?`;
  return `${name} is ${age} years old.`;
}

const convo = conversation();
console.log(convo.next());          // { value: "What's your name?", done: false }
console.log(convo.next("Alice"));    // { value: "Hi Alice, how old are you?", done: false }
console.log(convo.next("30"));        // { value: "Alice is 30 years old.", done: true }
```

Note the offset: the **first** `.next()` call just starts the generator
and runs it up to the first `yield` — any value passed to it is discarded
because there's no paused `yield` expression yet to receive it.

## 20.5 `yield*` — delegating to another iterable

`yield*` delegates iteration to another generator or iterable, yielding
each of its values in turn — useful for composing generators:

```js
function* inner() {
  yield 1;
  yield 2;
}
function* outer() {
  yield "start";
  yield* inner(); // delegates: yields 1, then 2, as if written inline
  yield "end";
}
console.log([...outer()]); // ["start", 1, 2, "end"]

function* flatten(iterableOfIterables) {
  for (const item of iterableOfIterables) {
    yield* item; // works for any iterable, not just other generators
  }
}
console.log([...flatten([[1, 2], [3, 4], [5]])]); // [1, 2, 3, 4, 5]
```

## 20.6 Infinite sequences and lazy evaluation

Because a generator only computes the next value when `.next()` is
called, generators can represent **infinite sequences** without ever
running out of memory — something a regular function returning an array
could never do:

```js
function* naturalNumbers() {
  let n = 1;
  while (true) {
    yield n++;
  }
}

function take(iterable, count) {
  const result = [];
  const it = iterable[Symbol.iterator]();
  for (let i = 0; i < count; i++) {
    const { value, done } = it.next();
    if (done) break;
    result.push(value);
  }
  return result;
}

console.log(take(naturalNumbers(), 5)); // [1, 2, 3, 4, 5] -- computed lazily, 5 at a time
```

```js
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
console.log(take(fibonacci(), 8)); // [0, 1, 1, 2, 3, 5, 8, 13]
```

This "lazy, pull-based" evaluation — compute only what's asked for, only
when it's asked for — is a genuinely different way of structuring code
compared to eagerly building arrays with `.map()`/`.filter()`, and it's
the same underlying idea that powers Node.js streams and, conceptually,
`async`/`await` (which we cover next, in Chapter 21-23, and which is
itself built on a generator-like mechanism under the hood).

## 20.7 `return()` and `throw()` on generators

Generator objects also have `.return(value)` and `.throw(error)` methods
that let external code end a generator early or inject an error into it:

```js
function* withCleanup() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log("cleanup ran"); // runs even if the generator is stopped early
  }
}

const g = withCleanup();
console.log(g.next());          // { value: 1, done: false }
console.log(g.return("done!")); // logs "cleanup ran", then { value: "done!", done: true }
console.log(g.next());          // { value: undefined, done: true } -- already finished
```

`for...of` automatically calls `.return()` on a generator if you `break`
out of the loop early, so `finally` blocks for resource cleanup (closing
a file handle, a database cursor) run reliably even on early exit.

## 20.8 A practical use case: paginated API iteration

Generators are a natural fit for hiding pagination behind a simple
`for...of` loop — the caller doesn't need to know or care that data is
arriving in pages:

```js
function* paginate(items, pageSize) {
  for (let i = 0; i < items.length; i += pageSize) {
    yield items.slice(i, i + pageSize); // yields one PAGE (array) at a time
  }
}

const allItems = Array.from({ length: 10 }, (_, i) => i + 1);
for (const page of paginate(allItems, 3)) {
  console.log("page:", page); // [1,2,3], [4,5,6], [7,8,9], [10]
}
```

In real code, an async generator (`async function*`, briefly noted in
Chapter 23) would `yield` pages fetched from a network API one request at
a time, and consuming code would use `for await...of` — same idea,
adapted for asynchronous data sources.

## 20.9 Chapter summary

- The **iterable protocol** (`Symbol.iterator` returning an object with
  `.next()`) is what makes `for...of`, spread, destructuring, and
  `Array.from()` work on arrays, strings, `Map`, `Set`, and any custom
  object that implements it.
- Generator functions (`function*`, `yield`) let you write an iterator's
  pause/resume logic as ordinary, linear-looking code instead of manually
  managing `{ value, done }` state.
- `.next(value)` sends a value into a paused `yield` expression;
  `yield*` delegates to another iterable, flattening its values into the
  current generator's output.
- Generators enable lazy, pull-based evaluation, including representing
  infinite sequences that only compute as many values as are actually
  consumed.
- `.return()`/`.throw()` (and `for...of`'s automatic `.return()` on
  `break`) let a generator's `finally` block run cleanup code reliably,
  even on early exit.

## 20.10 Exercises

1. Write a generator `evens(max)` that yields only even numbers from 0 up
   to `max`, then use it with `for...of` to print them.
2. Using the `take()` helper from 20.6, get the first 6 values of a
   `powersOfTwo()` generator you write yourself (1, 2, 4, 8, 16, 32).
3. Rewrite the custom `range` object from 20.2 as a generator function and
   confirm both versions produce identical output when spread into an
   array.
