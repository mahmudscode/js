# Chapter 13 — Destructuring, Spread & Rest

These three related ES2015+ features let you unpack values out of arrays
and objects (**destructuring**), expand a collection into individual
elements (**spread**), and gather multiple elements back into a single
array (**rest**). Together they eliminate a huge amount of manual indexing
and temporary-variable boilerplate from everyday JavaScript.

## 13.1 Array destructuring

```js
const point = [10, 20, 30];
const [x, y, z] = point;
console.log(x, y, z); // 10 20 30

// Skipping elements with empty commas
const [first, , third] = point;
console.log(first, third); // 10 30

// Default values — used only when the unpacked value is undefined
const [a = 1, b = 2, c = 3, d = 4] = [10, 20];
console.log(a, b, c, d); // 10 20 3 4

// Swapping two variables — no temp variable needed
let p = 1, q = 2;
[p, q] = [q, p];
console.log(p, q); // 2 1

// Rest in array destructuring — gathers the remainder into a new array
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head, tail); // 1 [2, 3, 4, 5]
```

Array destructuring works on **any iterable**, not just arrays — strings,
`Set`s, `Map`s, the results of generator functions:

```js
const [c1, c2, c3] = "abc";
console.log(c1, c2, c3); // "a" "b" "c"

const [firstEntry] = new Map([["k1", "v1"], ["k2", "v2"]]);
console.log(firstEntry); // ["k1", "v1"]
```

## 13.2 Object destructuring

```js
const user = { name: "Ada", age: 36, city: "London" };

const { name, age } = user;
console.log(name, age); // "Ada" 36

// Renaming while destructuring
const { name: fullName, age: years } = user;
console.log(fullName, years); // "Ada" 36

// Default values (used when the property is missing OR undefined)
const { name: n = "Anonymous", country = "Unknown" } = user;
console.log(n, country); // "Ada" "Unknown"

// Nested destructuring
const response = { data: { user: { id: 1, profile: { bio: "Engineer" } } } };
const { data: { user: { profile: { bio } } } } = response;
console.log(bio); // "Engineer"

// Rest in object destructuring — gathers remaining properties into a new object
const { name: userName, ...rest } = user;
console.log(userName, rest); // "Ada" { age: 36, city: "London" }
```

Unlike array destructuring, object destructuring pulls by **property
name**, not position, so key order in the object doesn't matter.

## 13.3 Destructuring in function parameters

This is one of the most common real-world uses — it turns an options
object into self-documenting, defaultable named parameters:

```js
// Without destructuring — caller must remember argument ORDER
function createUserBad(name, age, isAdmin, country) { /* ... */ }
createUserBad("Ada", 36, false, "UK"); // what does `false` mean here?!

// With destructuring — order doesn't matter, defaults are declarative,
// and the call site is self-documenting
function createUser({ name, age, isAdmin = false, country = "Unknown" }) {
  return { name, age, isAdmin, country };
}
createUser({ age: 36, name: "Ada", country: "UK" });
// { name: "Ada", age: 36, isAdmin: false, country: "UK" }

// Array destructuring in parameters works too — common in .map callbacks
// over [key, value] pairs from Object.entries()
Object.entries({ a: 1, b: 2 }).map(([key, value]) => `${key}=${value}`);
// ["a=1", "b=2"]
```

**Caution**: if you destructure a parameter and the caller passes no
argument at all, it throws (`Cannot destructure property 'name' of
'undefined'`) unless you give the *whole parameter* a default empty
object: `function f({ name } = {}) { ... }`.

## 13.4 The spread operator (`...`)

Spread *expands* an iterable or object into individual elements. It looks
identical to rest (`...`) but does the opposite job — the distinction is
purely about **where** it appears (rest collects in a binding position;
spread expands in a value position).

### Spread in arrays

```js
const a = [1, 2, 3];
const b = [4, 5, 6];

const combined = [...a, ...b];        // [1, 2, 3, 4, 5, 6]
const withExtra = [0, ...a, 3.5, ...b]; // [0, 1, 2, 3, 3.5, 4, 5, 6]
const copy = [...a];                    // shallow copy of an array
const fromString = [..."hello"];         // ["h","e","l","l","o"]
const max = Math.max(...a);               // spreading into a function call
```

### Spread in objects

```js
const defaults = { theme: "light", fontSize: 14 };
const overrides = { fontSize: 18 };
const settings = { ...defaults, ...overrides }; // { theme: "light", fontSize: 18 }
                                                  // later spreads win on conflicts
```

### Spread in function calls

```js
function sum3(a, b, c) { return a + b + c; }
const nums = [1, 2, 3];
sum3(...nums); // 6 — equivalent to sum3(1, 2, 3), but without hard-coding
```

## 13.5 The rest parameter

Rest *collects* multiple remaining arguments into a real array — it's the
modern replacement for the old, array-like-but-not-really `arguments`
object (Chapter 7):

```js
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4); // 10 — numbers is a real Array: [1, 2, 3, 4]

// Rest must be the LAST parameter — this is a syntax error otherwise
function logFirstThenRest(first, ...others) {
  console.log("first:", first, "others:", others);
}
logFirstThenRest(1, 2, 3, 4); // first: 1 others: [2, 3, 4]
```

## 13.6 Combining everything: realistic patterns

```js
// Clone-with-override, a extremely common pattern in state management
// (Redux reducers, React setState, config merging)
function updateUser(user, changes) {
  return { ...user, ...changes };
}
const original = { id: 1, name: "Ada", age: 36 };
const updated = updateUser(original, { age: 37 });
console.log(original, updated);
// { id: 1, name: 'Ada', age: 36 }  { id: 1, name: 'Ada', age: 37 }

// Extracting a subset of fields while dropping the rest (redacting a
// password before sending a user object to the client, for example)
function toPublicProfile({ password, ssn, ...publicFields }) {
  return publicFields;
}
toPublicProfile({ id: 1, name: "Ada", password: "secret", ssn: "123-45-6789" });
// { id: 1, name: "Ada" }

// Merging default config with nested overrides safely
function withDefaults(userConfig = {}) {
  const defaults = { retries: 3, timeout: 5000, headers: {} };
  return { ...defaults, ...userConfig, headers: { ...defaults.headers, ...userConfig.headers } };
}
```

Note the last example: naive top-level spread merges only the *first
level* — if `headers` is an object on both sides, one fully overwrites the
other unless you explicitly spread-merge that nested level too. This is
the same shallow-merge caveat from Chapter 9 resurfacing here.

## 13.7 Chapter summary

- Array destructuring unpacks by position (supports skipping, defaults,
  rest); object destructuring unpacks by property name (supports
  renaming, nested paths, defaults, rest).
- Destructuring function parameters turns positional arguments into
  self-documenting, order-independent named options.
- `...` means **spread** (expand a collection into elements) in a value
  position, and **rest** (collect elements into a collection) in a
  binding/parameter position — same syntax, opposite jobs, disambiguated
  by context.
- Spread merges (`{...a, ...b}`, `[...a, ...b]`) are shallow, just like
  `Object.assign` — nested structures still need their own explicit merge.

## 13.8 Exercises

1. Given `const [a, b, ...rest] = [1, 2, 3, 4, 5]`, predict all three
   values, then verify in `examples/13-destructuring-spread-rest.js`.
2. Write a function `omit(obj, keysToRemove)` using object destructuring
   rest that returns a new object without the specified keys.
3. Rewrite a function that currently takes 5 positional parameters (make
   one up) to instead take a single destructured options object with
   sensible defaults.
