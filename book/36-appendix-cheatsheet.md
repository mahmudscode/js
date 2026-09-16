# Chapter 36 — Appendix: Cheat Sheet

A dense, scannable reference for everything covered in this book. Use it to
jog your memory, not to learn a concept for the first time — each topic
here is explained properly in its own chapter.

## 36.1 Array method quick reference

| Method | Mutates? | Returns | Purpose |
|---|---|---|---|
| `push(x)` / `pop()` | Yes | new length / removed item | Add/remove at the end |
| `unshift(x)` / `shift()` | Yes | new length / removed item | Add/remove at the start |
| `splice(start, count, ...items)` | Yes | removed items | Insert/remove/replace anywhere |
| `sort(compareFn)` | Yes | the array | Sort in place (default: string order!) |
| `reverse()` | Yes | the array | Reverse in place |
| `fill(value)` | Yes | the array | Fill all/part with a value |
| `map(fn)` | No | new array | Transform every item |
| `filter(fn)` | No | new array | Keep items matching a condition |
| `reduce(fn, init)` | No | any accumulated value | Fold the array into one value |
| `find(fn)` / `findIndex(fn)` | No | item / index | First match, or `undefined`/`-1` |
| `findLast(fn)` / `findLastIndex(fn)` | No | item / index | Last match |
| `some(fn)` / `every(fn)` | No | boolean | Does any/every item match? |
| `includes(x)` | No | boolean | Does the array contain `x`? |
| `indexOf(x)` / `lastIndexOf(x)` | No | index or `-1` | Find by strict equality |
| `slice(start, end)` | No | new array | Extract a portion (non-destructive) |
| `concat(...arrs)` | No | new array | Combine arrays |
| `join(sep)` | No | string | Combine into a delimited string |
| `flat(depth)` | No | new array | Flatten nested arrays |
| `flatMap(fn)` | No | new array | `map` then `flat(1)` |
| `at(index)` | No | item | Supports negative indices (`at(-1)`) |
| `Array.from(iterable)` | — | new array | Build an array from any iterable/array-like |
| `Array.isArray(x)` | — | boolean | Reliable array type check |

## 36.2 String method quick reference

| Method | Purpose |
|---|---|
| `slice(start, end)` | Extract a substring (accepts negative indices) |
| `substring(start, end)` | Like `slice` but clamps negatives to 0 |
| `split(sep)` | String → array |
| `trim()` / `trimStart()` / `trimEnd()` | Remove whitespace |
| `toUpperCase()` / `toLowerCase()` | Case conversion |
| `includes(sub)` / `startsWith(sub)` / `endsWith(sub)` | Substring checks |
| `indexOf(sub)` / `lastIndexOf(sub)` | Find a substring's position |
| `replace(pattern, repl)` / `replaceAll(pattern, repl)` | Substitute text |
| `padStart(len, ch)` / `padEnd(len, ch)` | Pad to a fixed length |
| `repeat(n)` | Repeat the string |
| `concat(...strs)` | Combine strings (template literals are usually clearer) |
| `charAt(i)` / `[i]` | Get one character |
| `codePointAt(i)` | Unicode-aware char code |
| `match(regex)` / `matchAll(regex)` | Regex matching |
| `at(index)` | Supports negative indices |

## 36.3 Equality: `==` vs `===`

| Comparison | `==` (loose) | `===` (strict) |
|---|---|---|
| `1 == "1"` | `true` (coerces) | `false` |
| `0 == false` | `true` (coerces) | `false` |
| `null == undefined` | `true` (special case) | `false` |
| `NaN == NaN` | `false` | `false` (use `Number.isNaN`) |
| `[] == false` | `true` (coerces both sides) | `false` |
| `{} === {}` | `false` (different references) | `false` |

**Rule: always use `===`/`!==`** unless you have a specific, deliberate
reason to allow coercion (the most common legitimate case is checking for
both `null` and `undefined` at once with `x == null`).

## 36.4 Type coercion quick table

| Value | `Number(value)` | `String(value)` | `Boolean(value)` |
|---|---|---|---|
| `""` | `0` | `""` | `false` |
| `"0"` | `0` | `"0"` | `true` (non-empty string!) |
| `"  "` | `0` | `"  "` | `true` |
| `0` | `0` | `"0"` | `false` |
| `null` | `0` | `"null"` | `false` |
| `undefined` | `NaN` | `"undefined"` | `false` |
| `[]` | `0` | `""` | `true` |
| `[5]` | `5` | `"5"` | `true` |
| `[1,2]` | `NaN` | `"1,2"` | `true` |
| `{}` | `NaN` | `"[object Object]"` | `true` |
| `NaN` | `NaN` | `"NaN"` | `false` |

Every value is truthy **except**: `false`, `0`, `-0`, `0n`, `""`, `null`,
`undefined`, and `NaN` — memorize this exact list ("the falsy eight") since
everything else, including `[]` and `{}`, is truthy.

## 36.5 Async patterns quick reference

```js
// Callback (oldest style)
fs.readFile("file.txt", "utf8", (err, data) => { ... });

// Promise
fetch(url).then((res) => res.json()).then((data) => { ... }).catch((err) => { ... });

// async/await (built on promises, reads like sync code)
async function load() {
  try {
    const res = await fetch(url);
    const data = await res.json();
  } catch (err) { ... }
}

// Run promises concurrently, wait for all
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// Run concurrently, don't fail fast on one rejection
const results = await Promise.allSettled([fetchA(), fetchB()]);

// First to settle wins
const first = await Promise.race([fetchA(), timeout(3000)]);

// First to FULFILL wins (ignores rejections unless all reject)
const firstOk = await Promise.any([fetchA(), fetchB()]);
```

## 36.6 Common `Object` static methods

| Method | Purpose |
|---|---|
| `Object.keys(obj)` | Array of own enumerable keys |
| `Object.values(obj)` | Array of own enumerable values |
| `Object.entries(obj)` | Array of `[key, value]` pairs |
| `Object.fromEntries(pairs)` | Build an object from `[key, value]` pairs |
| `Object.assign(target, ...sources)` | Shallow-merge sources into target |
| `Object.freeze(obj)` | Prevent all mutation (shallow) |
| `Object.isFrozen(obj)` | Check freeze status |
| `Object.create(proto)` | Create an object with a given prototype |
| `Object.getPrototypeOf(obj)` | Read an object's prototype |
| `Object.defineProperty(obj, key, desc)` | Fine-grained property control |

## 36.7 Common `Math` and `Number` statics

| Expression | Purpose |
|---|---|
| `Math.max(...nums)` / `Math.min(...nums)` | Largest/smallest |
| `Math.round(x)` / `Math.floor(x)` / `Math.ceil(x)` / `Math.trunc(x)` | Rounding |
| `Math.random()` | Float in `[0, 1)` |
| `Math.abs(x)` / `Math.sign(x)` | Absolute value / sign |
| `Math.pow(x, y)` / `x ** y` | Exponentiation |
| `Number.isInteger(x)` | True integer check |
| `Number.isNaN(x)` | Reliable NaN check (unlike global `isNaN`) |
| `Number.parseFloat(s)` / `Number.parseInt(s, radix)` | String → number, always pass a radix to `parseInt` |
| `Number.MAX_SAFE_INTEGER` | `2^53 - 1`, the largest exactly-representable integer |

## 36.8 Common array/object idioms

```js
// Deduplicate an array
const unique = [...new Set(array)];

// Shallow copy an array or object
const arrCopy = [...array];
const objCopy = { ...obj };

// Deep clone (structured data, no functions/DOM nodes)
const deepCopy = structuredClone(obj);

// Merge objects, later keys win
const merged = { ...defaults, ...overrides };

// Destructure with defaults and renaming
const { name: userName = "Anonymous", age } = user;

// Group array items into an object of arrays
const byRole = array.reduce((acc, item) => {
  (acc[item.role] ??= []).push(item);
  return acc;
}, {});

// Safe nested access
const city = user?.address?.city ?? "Unknown";

// Convert array-like/iterable to a real array
const chars = Array.from("hello");
```

## 36.9 Glossary

- **Closure** — a function that "remembers" the variables from the scope it
  was created in, even after that outer scope has finished executing.
- **Hoisting** — `var` and function declarations are conceptually moved to
  the top of their scope before code runs; `let`/`const` are hoisted too
  but remain in a "temporal dead zone" until their declaration line runs.
- **Prototype** — the object a given object automatically delegates
  property/method lookups to when a property isn't found on the object
  itself.
- **Event loop** — the mechanism that lets single-threaded JavaScript
  handle asynchronous work: it repeatedly checks whether the call stack is
  empty and, if so, pushes the next queued callback onto it.
- **Microtask / macrotask** — promise callbacks (microtasks) run before
  timer/I/O callbacks (macrotasks) at each turn of the event loop.
- **Promise** — an object representing the eventual result (or failure) of
  an asynchronous operation, in one of three states: pending, fulfilled, or
  rejected.
- **Callback** — a function passed into another function to be called
  later, typically once some operation completes.
- **`this`** — a keyword whose value is determined by *how a function is
  called*, not where it's defined (except for arrow functions, which
  inherit `this` from their enclosing scope).
- **Truthy / falsy** — how a non-boolean value behaves in a boolean context
  (an `if` condition); see the falsy list in section 36.4.
- **Pure function** — a function whose output depends only on its inputs,
  with no side effects and no reliance on external mutable state.
- **Immutability** — the practice of not modifying data in place, instead
  producing new values (`[...arr, x]` instead of `arr.push(x)`).
- **Module** — a file with its own private scope, exposing selected
  bindings via `export`, consumed elsewhere via `import`.
- **Coercion** — automatic conversion between types, e.g. `"5" - 1` coerces
  `"5"` to the number `5`.
- **Event delegation** — attaching one listener to a parent element instead
  of many listeners to its children, using event bubbling to handle events
  from any of them.
- **Debounce / throttle** — rate-limiting techniques for high-frequency
  events; debounce waits for a pause, throttle enforces a fixed interval.
- **Memoization** — caching a pure function's results by input to avoid
  recomputation.

## 36.10 Further learning

This book is an end-to-end tour, not the final word on any single topic.
For deeper dives:

- **developer.mozilla.org (MDN Web Docs)** — the canonical, most accurate
  reference for every JavaScript, DOM, and Web API method mentioned in this
  book.
- **javascript.info** — a free, thorough, example-heavy online course
  covering the language and browser APIs in more depth than any single
  chapter here.
- **tc39.es** — the official home of the ECMAScript specification and the
  proposals process; browse it to see what's coming in future JavaScript
  versions and read the exact rationale behind language decisions.
- **The "You Don't Know JS" book series** (Kyle Simpson) — a deep,
  spec-adjacent exploration of the language's trickier corners: scope,
  closures, `this`, prototypes, and async — a natural next step after this
  book for readers who want to go even deeper on the "engine room" material
  from Part III.
- **Node.js's own official documentation** — the authoritative reference
  for every built-in module used throughout Part VI (`fs`, `http`,
  `events`, `path`, `node:test`, and more).

## 36.11 Closing note

You've now covered JavaScript from `let x = 1` to shipping tested,
documented, dependency-free projects in both the browser and Node.js. The
fastest way to make any of this permanent knowledge is the same as with any
skill: build something real with it. Take one of the two capstone projects
from Chapter 35, extend it with one of its suggested exercises, and let the
next bug you hit teach you the one thing this book couldn't — what *your*
specific mistakes look like, and how to debug them yourself.
