# Chapter 3 — Variables and Data Types

## 3.1 Declaring variables: `var`, `let`, and `const`

JavaScript has three keywords for declaring a variable, and the
differences between them are one of the most common interview questions
and real-world bug sources in the language.

```js
var a = 1;    // old (pre-ES6), function-scoped, hoisted and initialized to undefined
let b = 2;    // ES6+, block-scoped, hoisted but NOT initialized (temporal dead zone)
const c = 3;  // ES6+, block-scoped, must be initialized, cannot be reassigned
```

**Rule of thumb for modern code: default to `const`. Use `let` only when
you know the variable needs to be reassigned. Avoid `var` entirely.**

## 3.2 `const` does not mean immutable

A very common misconception: `const` prevents **reassignment** of the
variable binding, not **mutation** of the value it points to.

```js
const arr = [1, 2, 3];
arr.push(4);          // fine — mutating the array's contents
console.log(arr);     // [1, 2, 3, 4]

arr = [5, 6];          // TypeError: Assignment to constant variable.
```

```js
const user = { name: "Alice" };
user.name = "Bob";     // fine — mutating a property
user.age = 30;          // fine — adding a property
console.log(user);      // { name: 'Bob', age: 30 }

user = { name: "Carol" }; // TypeError: Assignment to constant variable.
```

If you need a truly immutable object, use `Object.freeze()` (shallow
freeze only — nested objects are still mutable):

```js
const frozen = Object.freeze({ name: "Alice" });
frozen.name = "Bob"; // silently fails in sloppy mode, throws in strict mode
console.log(frozen.name); // "Alice" — unchanged
```

## 3.3 Scope: function-scoped vs. block-scoped

`var` is **function-scoped** — it's visible throughout the entire function
it was declared in, ignoring block boundaries like `if` or `for`:

```js
function varScopeDemo() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 — leaked out of the if-block
}
```

`let` and `const` are **block-scoped** — confined to the nearest enclosing
`{ }`:

```js
function letScopeDemo() {
  if (true) {
    let y = 10;
  }
  console.log(y); // ReferenceError: y is not defined
}
```

This matters enormously in loops:

```js
// Classic interview bug, using var:
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var i:", i), 0);
}
// prints "var i: 3" three times — all callbacks share the SAME `i`,
// and by the time they run, the loop has already finished with i === 3

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let j:", j), 0);
}
// prints "let j: 0", "let j: 1", "let j: 2" — each iteration of a `let`
// loop gets its OWN binding of j
```

We'll formalize why this happens with closures in Chapter 14, but the
practical takeaway now is: **this is one of the strongest reasons to
prefer `let`/`const` over `var`.**

## 3.4 Hoisting and the Temporal Dead Zone

**Hoisting** means variable and function *declarations* are processed
before any code runs, conceptually "moved to the top" of their scope.
But `var`, `let`, and `const` are hoisted differently:

```js
console.log(varVariable); // undefined (declaration hoisted, not the assignment)
var varVariable = "hello";

console.log(letVariable); // ReferenceError: Cannot access 'letVariable' before initialization
let letVariable = "hello";
```

`let` and `const` ARE hoisted (the engine knows they exist), but they are
not initialized until their declaration line executes. The gap between
the start of the scope and the declaration line is called the
**Temporal Dead Zone (TDZ)** — accessing the variable in that gap throws.
This is a deliberate safety feature that catches use-before-declaration
bugs that `var` would silently allow.

```js
// Function declarations are fully hoisted, including their body:
sayHi(); // works! "Hi!"
function sayHi() { console.log("Hi!"); }

// Function EXPRESSIONS follow the variable's hoisting rules:
sayBye(); // TypeError: sayBye is not a function (var sayBye is hoisted as undefined)
var sayBye = function () { console.log("Bye!"); };
```

## 3.5 Redeclaration rules

```js
var v = 1;
var v = 2; // fine — var allows redeclaration in the same scope

let l = 1;
let l = 2; // SyntaxError: Identifier 'l' has already been declared

const c = 1;
let c = 2; // SyntaxError — can't mix, same rule applies
```

This is another reason `let`/`const` catch bugs `var` doesn't: accidentally
redeclaring a variable (e.g., a typo reusing a loop variable name) is an
error instead of silent overwriting.

## 3.6 Primitive types

JavaScript has **seven primitive types**. Primitives are immutable and are
compared and copied **by value**.

| Type | Example | `typeof` result |
|---|---|---|
| Number | `42`, `3.14`, `-7` | `"number"` |
| String | `"hello"` | `"string"` |
| Boolean | `true`, `false` | `"boolean"` |
| `undefined` | `undefined` | `"undefined"` |
| `null` | `null` | `"object"` (a famous, permanent language bug) |
| Symbol | `Symbol("id")` | `"symbol"` |
| BigInt | `9007199254740993n` | `"bigint"` |

### `undefined` vs `null`

Both represent "no value," but with different intent:

- `undefined` — a variable has been declared but not assigned; a function
  with no explicit `return` returns `undefined`; accessing a non-existent
  object property returns `undefined`. This is JavaScript's own way of
  saying "nothing here."
- `null` — an intentional, explicit "no value," assigned by *you* (or by
  some APIs, like `document.getElementById` when nothing matches) to
  signal "this is deliberately empty."

```js
let a;
console.log(a); // undefined — never assigned

let b = null;
console.log(b); // null — deliberately empty

console.log(typeof undefined); // "undefined"
console.log(typeof null);      // "object"  <- historical bug in JS, kept for compatibility
console.log(null == undefined);  // true (loose equality treats them as equal)
console.log(null === undefined); // false (different types)
```

### Symbol

A `Symbol` is a unique, immutable primitive value, often used as a
collision-free object property key:

```js
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log(id1 === id2); // false — every Symbol is unique, even with the same description

const user = {
  name: "Alice",
  [id1]: "hidden-internal-id-12345",
};
console.log(Object.keys(user)); // ["name"] — symbol keys don't show up in normal enumeration
```

### BigInt

Regular numbers cannot safely represent integers beyond
`Number.MAX_SAFE_INTEGER` (2^53 - 1). `BigInt` (suffix `n`) exists for
arbitrary-precision integers:

```js
console.log(Number.MAX_SAFE_INTEGER);      // 9007199254740991
console.log(Number.MAX_SAFE_INTEGER + 1);  // 9007199254740992 (correct, barely)
console.log(Number.MAX_SAFE_INTEGER + 2);  // 9007199254740992 (WRONG — should be 993, precision lost)

const big = 9007199254740993n;
console.log(big + 1n); // 9007199254740994n — exact

// You cannot mix BigInt and Number in arithmetic directly:
// console.log(1n + 1); // TypeError: Cannot mix BigInt and other types
```

## 3.7 The object type (reference type)

Everything that isn't a primitive is an **object** — including plain
objects `{}`, arrays `[]`, functions, `Date`, `Map`, `Set`, regular
expressions, and more. Objects are compared and copied **by reference**,
which is the single biggest behavioral difference from primitives.

```js
console.log(typeof {});          // "object"
console.log(typeof []);          // "object"  (arrays are objects!)
console.log(typeof function(){}); // "function" (a special callable object)
console.log(typeof new Date());  // "object"
console.log(Array.isArray([]));  // true — the reliable way to check for an array
```

## 3.8 Value semantics vs. reference semantics

This is one of the most important mental models in the entire language.

**Primitives are copied by value** — assigning or passing a primitive
creates an independent copy:

```js
let x = 10;
let y = x;   // y gets a COPY of the value 10
y = 20;
console.log(x, y); // 10 20 — x is untouched
```

**Objects are copied by reference** — the variable doesn't hold the object
itself, it holds a reference (like a pointer/address) to where the object
lives in memory. Assigning an object copies the *reference*, not the
object:

```js
let obj1 = { value: 10 };
let obj2 = obj1; // obj2 points to the SAME object as obj1
obj2.value = 20;
console.log(obj1.value); // 20 — obj1 sees the change too, because
                          // obj1 and obj2 reference the same underlying object
```

```
obj1 ──┐
       ├──> { value: 20 }   (one object in memory, two references to it)
obj2 ──┘
```

This explains why comparing two objects with identical contents is
`false`:

```js
console.log({ a: 1 } === { a: 1 }); // false — different objects in memory
const a = { a: 1 };
const b = a;
console.log(a === b); // true — same reference
```

And it explains why passing an object into a function lets that function
mutate the caller's data:

```js
function addAdmin(user) {
  user.role = "admin"; // mutates the object the caller passed in
}
const me = { name: "Alice" };
addAdmin(me);
console.log(me); // { name: 'Alice', role: 'admin' } — changed!
```

We revisit this in depth when discussing shallow vs. deep copies in
Chapter 9 (Objects) and immutability patterns in Chapter 19.

## 3.9 `typeof` and its quirks

```js
typeof 42;             // "number"
typeof "hi";            // "string"
typeof true;             // "boolean"
typeof undefined;         // "undefined"
typeof null;               // "object"   <- the famous bug, never fixed for backward compatibility
typeof Symbol();            // "symbol"
typeof 10n;                  // "bigint"
typeof {};                    // "object"
typeof [];                     // "object"   <- use Array.isArray() instead
typeof function(){};            // "function"
typeof class Foo {};             // "function" <- classes are functions under the hood (Ch. 17)
typeof NaN;                       // "number"  <- NaN is technically a number!
```

## 3.10 `NaN`: Not a Number (but typeof number)

`NaN` results from invalid numeric operations, and has one bizarre
property: **it is the only value in JavaScript that is not equal to
itself.**

```js
console.log(0 / 0);           // NaN
console.log("abc" * 2);        // NaN
console.log(NaN === NaN);       // false !!
console.log(NaN == NaN);         // false !!

console.log(isNaN("abc"));         // true — but isNaN coerces its argument first
console.log(isNaN(undefined));      // true — undefined coerces to NaN too, misleading!
console.log(Number.isNaN("abc"));    // false — does NOT coerce, and "abc" is not the NaN value
console.log(Number.isNaN(NaN));       // true — correctly identifies actual NaN
console.log(Number.isNaN(undefined));  // false — correct, undefined isn't NaN, just coerces to it
```

**Rule: always prefer `Number.isNaN()` over the global `isNaN()`.** The
global version coerces its argument to a number first, producing false
positives for values like `undefined`, `{}`, or `"hello"`.

To check for `NaN` reliably without either function:

```js
const value = NaN;
console.log(value !== value); // true only for NaN — a classic trick, but Number.isNaN is clearer
```

## 3.11 Checking a variable's type reliably

Because `typeof null === "object"` and `typeof [] === "object"`, a robust
type-check function often needs `Object.prototype.toString`:

```js
function getType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

console.log(getType(null));       // "null"
console.log(getType([1, 2]));      // "array"
console.log(getType({}));           // "object"
console.log(getType(42));            // "number"

// The most precise tool, useful for Map, Set, Date, RegExp, etc:
console.log(Object.prototype.toString.call([]));      // "[object Array]"
console.log(Object.prototype.toString.call(null));     // "[object Null]"
console.log(Object.prototype.toString.call(new Date())); // "[object Date]"
```

## 3.12 Chapter summary

- Prefer `const` by default, `let` when reassignment is needed, and avoid
  `var` in modern code.
- `const` prevents reassigning the *variable*, not mutating the *value*.
- `var` is function-scoped and hoisted with an `undefined` initial value;
  `let`/`const` are block-scoped and hoisted into a Temporal Dead Zone
  that throws if accessed before declaration.
- JavaScript has seven primitive types, compared/copied **by value**, and
  one object type, compared/copied **by reference**.
- `undefined` means "never assigned"; `null` means "intentionally empty."
- `typeof null` is `"object"` — a decades-old bug kept for compatibility;
  use `=== null` or `Array.isArray()` for reliable checks.
- `NaN` is never equal to itself; use `Number.isNaN()`, not the coercing
  global `isNaN()`.

## 3.13 Exercises

1. Predict what `console.log(a); let a = 5;` does, and why, before running
   it.
2. Write a function `deepEqualPrimitive(a, b)` that correctly returns
   `true` for `deepEqualPrimitive(NaN, NaN)` without using
   `Number.isNaN` twice (hint: `Object.is`).
3. Given `const list = [1, 2, 3]; const copy = list;`, explain in your own
   words why `copy.push(4)` also changes what `list` contains, and then
   run `examples/03-variables-and-data-types.js` to confirm.
