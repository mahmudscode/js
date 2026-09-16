# Chapter 6 — Loops and Iteration

## 6.1 The classic `for` loop

```js
for (let i = 0; i < 5; i++) {
  console.log(i); // 0, 1, 2, 3, 4
}
```

The three clauses — initialization, condition, increment — are all
optional, giving you full control:

```js
// counting down
for (let i = 5; i > 0; i--) {
  console.log(i);
}

// multiple variables
for (let i = 0, j = 10; i < j; i++, j--) {
  console.log(i, j);
}

// infinite loop (needs a break inside)
for (;;) {
  console.log("runs once");
  break;
}
```

## 6.2 `while` and `do...while`

```js
let count = 0;
while (count < 3) {
  console.log("while:", count);
  count++;
}

let n = 0;
do {
  console.log("do-while:", n); // runs at least once, even if the condition is false
  n++;
} while (n < 3);

let m = 10;
do {
  console.log("this still runs once:", m);
} while (m < 5); // condition is false immediately, but the body already ran
```

**`do...while` guarantees the body runs at least once**, because the
condition is checked *after* the first iteration — useful for
"do the work, then decide whether to repeat" logic like menu prompts or
retry loops.

## 6.3 `for...of` — iterating values

`for...of` iterates over the **values** of any *iterable* — arrays,
strings, `Map`, `Set`, and anything implementing the iterator protocol
(Chapter 20). This is almost always what you want for arrays:

```js
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
  console.log(fruit); // "apple", "banana", "cherry"
}

for (const char of "hi") {
  console.log(char); // "h", "i"
}

const uniqueNums = new Set([1, 2, 2, 3]);
for (const num of uniqueNums) {
  console.log(num); // 1, 2, 3 (duplicates already removed by Set)
}

const map = new Map([["a", 1], ["b", 2]]);
for (const [key, value] of map) {
  console.log(key, value); // "a" 1, then "b" 2
}

// Getting the index too, via entries():
for (const [index, fruit] of fruits.entries()) {
  console.log(index, fruit); // 0 "apple", 1 "banana", 2 "cherry"
}
```

## 6.4 `for...in` — iterating keys

`for...in` iterates over the **enumerable property keys** of an object
(including inherited ones from the prototype chain). It exists for
objects, not arrays:

```js
const user = { name: "Alice", age: 30 };
for (const key in user) {
  console.log(key, user[key]); // "name" "Alice", then "age" 30
}
```

### Why not to use `for...in` on arrays

```js
const arr = ["a", "b", "c"];
for (const index in arr) {
  console.log(typeof index, index); // "string" "0", "string" "1", "string" "2" -- indices are STRINGS
}

// Worse: it also picks up inherited/enumerable properties added to Array.prototype or the array itself
Array.prototype.extra = "oops"; // pollutes every array (never do this in real code!)
for (const key in arr) {
  console.log(key); // "0", "1", "2", "extra"  <- unexpected!
}
delete Array.prototype.extra; // clean up
```

**Rule: use `for...of` (or array methods like `.forEach`/`.map`) for
arrays. Use `for...in` only for plain objects, and even then, prefer
`Object.keys()`/`Object.entries()` with `for...of`, which sidesteps the
inherited-properties issue entirely:**

```js
for (const key of Object.keys(user)) {
  console.log(key);
}
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}
```

## 6.5 `break` and `continue`

```js
for (let i = 0; i < 10; i++) {
  if (i === 5) break; // exits the loop entirely
  console.log("break demo:", i); // 0, 1, 2, 3, 4
}

for (let i = 0; i < 5; i++) {
  if (i % 2 === 0) continue; // skips the rest of THIS iteration, moves to next
  console.log("continue demo:", i); // 1, 3
}
```

### Labeled loops

A **label** lets `break`/`continue` target an *outer* loop from inside a
nested one — useful for exiting nested loops in one step instead of
juggling flag variables:

```js
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (j === 1) continue outer; // skips to the NEXT iteration of the outer loop
    console.log(i, j);
  }
}

search: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) break search; // breaks out of BOTH loops at once
    console.log("searching", i, j);
  }
}
```

Labels are uncommon in everyday code (they have a reputation for reading
like `goto`), but are the cleanest tool for this specific "break out of
nested loops" problem — better than a boolean flag checked in every
iteration.

## 6.6 Iterating `Map` and `Set`

```js
const scores = new Map([["Alice", 90], ["Bob", 85]]);
for (const [name, score] of scores) {
  console.log(name, score);
}
scores.forEach((score, name) => console.log(name, score)); // note: (value, key) order!

const tags = new Set(["js", "web", "js"]);
for (const tag of tags) {
  console.log(tag); // "js", "web" -- duplicate silently ignored by Set
}
```

## 6.7 Performance notes

For the vast majority of code, loop performance differences are
negligible compared to what the loop *body* does (network calls, DOM
updates, allocations). Some practical notes, not premature-optimization
advice:

- A classic `for` loop with a numeric index is typically the fastest
  option in any engine, but the difference vs. `for...of` or
  `.forEach()` is rarely meaningful outside hot paths processing millions
  of elements.
- Caching `array.length` in a variable before a loop
  (`const len = arr.length;`) mattered on very old engines; modern V8
  optimizes `.length` access on arrays effectively, so this is no longer
  necessary for correctness or performance in typical code.
- `.forEach()`, `.map()`, `.filter()` etc. (Chapter 8) cannot be exited
  early with `break` — if you need early exit, use a `for...of` loop with
  `break`, or `.some()`/`.every()`/`.find()` which stop as soon as their
  condition is satisfied.
- Prefer readability first. Only reach for manual loop-optimization once
  you've profiled and confirmed a loop is actually a bottleneck.

## 6.8 Common infinite-loop bugs

```js
// BUG: forgot to increment i
// for (let i = 0; i < 5;) {
//   console.log(i); // loops forever, i never changes
// }

// BUG: condition never becomes false because of a typo
// let i = 0;
// while (i = 5) { // assignment (=) instead of comparison (===) -- always truthy!
//   console.log(i);
// }

// BUG: mutating the wrong variable
// for (let i = 0; i < 5; j++) { // increments j, not i -- i stays 0 forever
//   console.log(i);
// }
```

All three are extremely common typos. Most linters flag assignment inside
a condition (`while (i = 5)`) by default — another good reason to run a
linter (Chapter 2.7) from day one.

## 6.9 Chapter summary

- `for`, `while`, and `do...while` give manual control over iteration;
  `do...while` always runs its body at least once.
- `for...of` iterates **values** of any iterable (arrays, strings, `Map`,
  `Set`) and is the default choice for arrays.
- `for...in` iterates **enumerable keys**, including inherited ones —
  use it for plain objects only, never arrays; prefer
  `Object.keys()`/`Object.entries()` with `for...of` for safety.
- `break` exits a loop; `continue` skips to the next iteration; labels
  let both target an outer loop from a nested one.
- Loop performance rarely matters compared to what's inside the loop body
  — optimize for readability first.

## 6.10 Exercises

1. Given `const nums = [1, 2, 3, 4, 5, 6];`, write a `for...of` loop that
   logs only even numbers using `continue`.
2. Write a nested loop over a 3×3 grid that breaks out of both loops
   entirely as soon as it finds coordinates where `x === y === 1`, using
   a label.
3. Rewrite a `for...in` loop over an array into a safer `for...of` loop
   using `.entries()`, and explain in a comment why the original was
   risky.
