# Chapter 8 — Arrays

## 8.1 What is an array?

An array is an ordered, index-based collection of values. In JavaScript,
arrays are a special kind of object — `typeof []` returns `"object"` — but
they have integer-keyed elements, an automatically-maintained `length`
property, and a large built-in set of methods (`Array.prototype`) tuned for
working with sequences of data.

```js
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);      // "apple"
console.log(fruits.length);  // 3
console.log(typeof fruits);  // "object"
console.log(Array.isArray(fruits)); // true — the reliable type check
```

Arrays can hold values of any type, including mixed types and other arrays:

```js
const mixed = [1, "two", true, null, { id: 4 }, [5, 6]];
```

This is legal but rarely a good idea outside of quick scripts — mixed-type
arrays make code harder to reason about and defeat engine optimizations
that assume a consistent element type (see §8.9).

## 8.2 Creating arrays

```js
const a = [1, 2, 3];              // array literal — always prefer this
const b = new Array(1, 2, 3);     // equivalent, but avoid the constructor
const c = new Array(5);           // DANGER: creates a sparse array of
                                   // length 5, NOT [5]. Classic footgun.
const d = Array.from({ length: 5 }, (_, i) => i * 2); // [0,2,4,6,8]
const e = Array.of(5);            // [5] — Array.of fixes the Array() footgun
const f = [...a, ...b];           // spread-based construction
```

`Array.from` is one of the most useful array constructors: it converts
*array-like* or *iterable* values (strings, `Set`s, `Map`s, `NodeList`s,
arguments objects) into real arrays, optionally applying a mapping function
as the second argument.

```js
Array.from("hello");             // ["h","e","l","l","o"]
Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]
Array.from({ length: 3 }, (_, i) => i ** 2); // [0, 1, 4]
```

## 8.3 Indexing, length, and out-of-bounds access

Arrays are zero-indexed. Reading an index that doesn't exist returns
`undefined` rather than throwing:

```js
const arr = [10, 20, 30];
console.log(arr[10]);       // undefined — no error
console.log(arr[-1]);       // undefined — negative indices are NOT
                             // supported by bracket access (unlike Python)
console.log(arr.at(-1));    // 30 — Array.prototype.at() DOES support
                             // negative indices (ES2022)
```

`length` is not read-only — setting it truncates or extends the array:

```js
const nums = [1, 2, 3, 4, 5];
nums.length = 3;
console.log(nums); // [1, 2, 3]

nums.length = 5;
console.log(nums); // [1, 2, 3, <2 empty items>] — sparse "holes", not undefined
```

## 8.4 Mutating methods (change the original array)

These methods modify the array in place and (mostly) return something
other than the new array itself — a common trap for developers who expect
a new array back.

| Method | Effect | Returns |
|---|---|---|
| `push(...items)` | adds to the end | new length |
| `pop()` | removes from the end | removed element |
| `unshift(...items)` | adds to the start | new length |
| `shift()` | removes from the start | removed element |
| `splice(start, deleteCount, ...items)` | removes/inserts at any index | array of removed elements |
| `sort(compareFn)` | sorts in place | the same array (sorted) |
| `reverse()` | reverses in place | the same array (reversed) |
| `fill(value, start, end)` | fills range with a value | the same array |
| `copyWithin(target, start, end)` | copies part of array to another index | the same array |

```js
const stack = [1, 2, 3];
stack.push(4);           // [1, 2, 3, 4]
stack.pop();              // returns 4; stack is now [1, 2, 3]

const queue = [1, 2, 3];
queue.unshift(0);         // [0, 1, 2, 3]
queue.shift();             // returns 0; queue is now [1, 2, 3]

const letters = ["a", "b", "c", "d", "e"];
const removed = letters.splice(1, 2, "x", "y", "z");
console.log(letters); // ["a", "x", "y", "z", "d", "e"]
console.log(removed); // ["b", "c"]
```

**`push`/`pop` are O(1)** (fast). **`shift`/`unshift` are O(n)** because
every remaining element has to be re-indexed. If you're building a queue
that gets large, prefer pushing and reading from the end, or use a proper
deque-like structure, rather than repeatedly calling `shift()`.

## 8.5 Non-mutating methods (return a new array or value)

These are the methods you should reach for by default, because they don't
have hidden side effects on the original array — critical for predictable
code, and required by frameworks like React that rely on referential
equality to detect changes.

```js
const nums = [5, 3, 8, 1, 9, 2];

nums.slice(1, 4);        // [3, 8, 1] — original untouched
nums.concat([10, 11]);    // [5,3,8,1,9,2,10,11] — original untouched
nums.map(n => n * 2);     // [10,6,16,2,18,4]
nums.filter(n => n > 4);  // [5,8,9]
nums.reduce((sum, n) => sum + n, 0); // 28
nums.includes(8);          // true
nums.indexOf(8);           // 2
nums.find(n => n > 4);     // 5 (first match)
nums.findIndex(n => n > 4);// 0
nums.some(n => n > 8);     // true
nums.every(n => n > 0);    // true
nums.join(", ");           // "5, 3, 8, 1, 9, 2"
```

### `.map()` vs `.forEach()`

`forEach` runs a callback for each element and always returns `undefined`
— use it purely for side effects (logging, pushing into an external
array). `map` builds and returns a brand-new array from the callback's
return values — use it when you want a transformed array back.

```js
// Wrong: map used for side effects, return value thrown away, wasteful
nums.map(n => console.log(n));

// Right:
nums.forEach(n => console.log(n));
const doubled = nums.map(n => n * 2);
```

### `.reduce()` deep dive

`reduce` is the most general-purpose array method — `map`, `filter`, and
even `forEach` can all be implemented in terms of `reduce`. Its signature:

```js
array.reduce((accumulator, currentValue, index, array) => { ... }, initialValue)
```

```js
// Sum
[1, 2, 3, 4].reduce((sum, n) => sum + n, 0); // 10

// Group by property — a very common real-world use
const people = [
  { name: "Ana", dept: "eng" },
  { name: "Bo", dept: "sales" },
  { name: "Cy", dept: "eng" },
];
const byDept = people.reduce((groups, person) => {
  (groups[person.dept] ??= []).push(person);
  return groups;
}, {});
// { eng: [Ana, Cy], sales: [Bo] }

// Flatten one level (equivalent to Array.prototype.flat())
[[1, 2], [3, 4]].reduce((flat, arr) => flat.concat(arr), []); // [1,2,3,4]
```

**Always pass an initial value to `reduce`** unless you deliberately want
the first element used as the seed — omitting it on an empty array throws
`TypeError: Reduce of empty array with no initial value`.

### `.flat()` and `.flatMap()`

```js
[1, [2, 3], [4, [5, 6]]].flat();       // [1, 2, 3, 4, [5, 6]] (depth 1)
[1, [2, 3], [4, [5, 6]]].flat(2);      // [1, 2, 3, 4, 5, 6]
[1, [2, [3, [4]]]].flat(Infinity);     // fully flatten, any depth

// flatMap = map then flatten one level — useful for "expand" operations
["hello world", "foo bar"].flatMap(s => s.split(" "));
// ["hello", "world", "foo", "bar"]
```

## 8.6 Searching and testing arrays

```js
const users = [
  { id: 1, name: "Ana", active: true },
  { id: 2, name: "Bo", active: false },
];

users.find(u => u.id === 2);        // { id: 2, name: "Bo", active: false }
users.findIndex(u => u.id === 2);    // 1
users.findLast(u => u.active);       // last match, ES2023
users.findLastIndex(u => u.active);  // ES2023
users.some(u => u.active);           // true — at least one
users.every(u => u.active);          // false — not all
```

`indexOf`/`includes` use strict equality (`===`) and so work well for
primitives but cannot find objects by *value* — only by *reference*:

```js
[{ id: 1 }].includes({ id: 1 }); // false! different object references
```

## 8.7 Sorting — the classic footgun

`Array.prototype.sort()` converts elements to strings and sorts
**lexicographically (alphabetically) by default** — not numerically. This
surprises nearly every JavaScript beginner:

```js
[10, 1, 21, 2].sort();
// [1, 10, 2, 21]  <-- WRONG if you wanted numeric order!
```

Always supply a compare function for numbers:

```js
[10, 1, 21, 2].sort((a, b) => a - b); // ascending: [1, 2, 10, 21]
[10, 1, 21, 2].sort((a, b) => b - a); // descending: [21, 10, 2, 1]

// Sorting objects by a field:
users.sort((a, b) => a.name.localeCompare(b.name)); // string sort, locale-aware
```

`sort()` mutates the original array. If you need to keep the original
order intact, sort a copy: `[...arr].sort(...)` or `arr.toSorted(...)`
(ES2023's non-mutating sibling, alongside `toReversed`, `toSpliced`, and
`with`).

## 8.8 Multi-dimensional arrays

JavaScript has no native 2D array type — you nest arrays inside arrays:

```js
const grid = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];
console.log(grid[1][1]); // 1 — row 1, column 1

// Building an n x m grid safely (avoid Array(n).fill(Array(m)) — that
// shares ONE inner array reference across every row!)
const rows = 3, cols = 3;
const safeGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
safeGrid[0][0] = 9;
console.log(safeGrid[1][0]); // 0, not 9 — each row is a distinct array
```

## 8.9 Performance notes: sparse vs. dense arrays

A **dense** array has a value at every index from `0` to `length - 1`. A
**sparse** array has gaps ("holes"):

```js
const sparse = [1, , 3];       // hole at index 1
const alsoSparse = new Array(3); // 3 holes, no values at all
```

Engines like V8 optimize dense arrays with a consistent element type
(all numbers, or all "packed" objects) far more aggressively than sparse or
mixed-type arrays. Practical takeaways:

- Prefer `Array.from({length: n}, fn)` or `push` in a loop over
  `new Array(n)` followed by manual index assignment, to avoid holes.
- Avoid `delete arr[i]` (creates a hole) — use `splice` instead.
- Iteration methods (`forEach`, `map`, `filter`, …) **skip holes entirely**,
  which is a subtle but important difference from a `for` loop that would
  see `undefined` at a hole.

```js
const s = [1, , 3];
s.forEach(x => console.log(x)); // logs 1, then 3 — hole is skipped!
for (let i = 0; i < s.length; i++) console.log(s[i]); // logs 1, undefined, 3
```

## 8.10 A preview of destructuring with arrays

Array destructuring (fully covered in Chapter 13) lets you unpack values
by position:

```js
const [first, second, ...rest] = [1, 2, 3, 4, 5];
console.log(first, second, rest); // 1 2 [3, 4, 5]

const [, , third] = [1, 2, 3]; // skip elements with empty commas
console.log(third); // 3
```

## 8.11 Chapter summary

- Arrays are ordered, index-based objects with a dynamic `length` and a
  rich `Array.prototype` method set.
- Mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, …) change
  the original array; non-mutating methods (`map`, `filter`, `slice`,
  `concat`, …) return a new array and leave the original untouched —
  prefer the latter for predictable code.
- `sort()` is lexicographic by default; always pass a compare function for
  numbers.
- `reduce` is the most general array method and underlies grouping,
  flattening, and summing patterns.
- Avoid sparse arrays (`new Array(n)`, `delete arr[i]`) — they defeat
  engine optimizations and behave inconsistently across iteration methods.

## 8.12 Exercises

1. Write a function `unique(arr)` that returns an array with duplicate
   values removed, using `filter` + `indexOf` and, separately, using `Set`.
2. Given `const orders = [{amount: 20},{amount: 5},{amount: 40}]`, use
   `reduce` to compute the total amount.
3. Explain, without running it, what `[3, 25, 8, 1].sort()` returns and why.
   Then fix it to sort numerically ascending.
4. Run `examples/08-arrays.js` and read through every logged line —
   predict each output before it prints.
