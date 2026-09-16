# Chapter 4 — Operators

## 4.1 Arithmetic operators

```js
5 + 3;   // 8   addition (or string concatenation if either side is a string)
5 - 3;   // 2   subtraction
5 * 3;   // 15  multiplication
5 / 3;   // 1.6666666666666667  division
5 % 3;   // 2   remainder (modulo)
5 ** 3;  // 125 exponentiation (ES2016)

let n = 5;
n++;     // post-increment: returns old value, then increments -> n is now 6
n--;     // post-decrement: returns old value, then decrements -> n is now 5
++n;     // pre-increment: increments first, then returns new value -> n is now 6
--n;     // pre-decrement -> n is now 5
```

The difference between `n++` and `++n` only matters when you use the
*result* of the expression:

```js
let a = 5;
let b = a++; // b = 5 (old value), a is now 6
let c = 6;
let d = ++c; // d = 7 (new value), c is now 7
```

## 4.2 Assignment operators

```js
let x = 10;
x += 5;  // x = x + 5  -> 15
x -= 3;  // x = x - 3  -> 12
x *= 2;  // x = x * 2  -> 24
x /= 4;  // x = x / 4  -> 6
x %= 4;  // x = x % 4  -> 2
x **= 3; // x = x ** 3 -> 8
```

### Logical assignment operators (ES2021)

These combine a logical operator with assignment, and — critically — they
**only evaluate/assign the right-hand side when needed**, unlike a plain
`||`/`??` assignment which always evaluates:

```js
let a = null;
a ??= "default";      // assigns only if a is null or undefined -> a = "default"

let count = 0;
count ||= 10;          // assigns only if count is falsy -> count = 10 (0 is falsy!)

let config = { theme: "dark" };
config.theme &&= "light"; // assigns only if config.theme is truthy -> "light"
```

## 4.3 Comparison operators: `==` vs `===`

This is the single most important operator distinction in JavaScript.

- `===` (**strict equality**) compares value *and* type. No conversion
  happens. **Use this by default, always.**
- `==` (**loose equality**) converts (coerces) operands to the same type
  before comparing, following a specific, sometimes-surprising algorithm.

```js
5 === 5;       // true
5 === "5";     // false -- different types
5 == "5";      // true -- "5" coerced to 5

null === undefined; // false
null == undefined;  // true -- special case, they're loosely equal to each other and nothing else

0 == false;    // true
0 == "";       // true
0 == "0";      // true
false == "0";  // true
"" == "0";     // false  <- this one breaks the "transitive" intuition!

NaN == NaN;    // false -- NaN is never equal to anything, including itself
```

The `"" == "0"` result above (`false`) despite `0 == ""` and `0 == "0"`
both being `true` is a classic demonstration of why loose equality is
considered dangerous: it isn't even transitive in the way you'd expect
from "equality." **Modern style guides and linters (ESLint's
`eqeqeq` rule) ban `==`/`!=` entirely except for the one common idiom
`x == null` (which conveniently checks for both `null` and `undefined` in
one comparison).**

Relational comparisons (`<`, `>`, `<=`, `>=`) also coerce non-numeric
operands:

```js
"10" > "9";   // false! -- both are strings, compared lexicographically ('1' < '9')
10 > 9;        // true  -- both are numbers
"10" > 9;       // true  -- "10" coerced to number 10
```

## 4.4 Logical operators and short-circuiting

```js
true && false;  // false
true || false;  // true
!true;           // false
```

`&&` and `||` don't just produce booleans — they return one of their
**actual operands**, which is extremely commonly used in real code:

```js
// && returns the first falsy operand, or the last operand if all are truthy
console.log(0 && "hello");        // 0 (first falsy value, stops here)
console.log(1 && "hello");         // "hello" (1 is truthy, so evaluate and return the next)
console.log("a" && "b" && "c");     // "c" (all truthy, returns the last)

// || returns the first truthy operand, or the last operand if all are falsy
console.log(0 || "default");        // "default" (0 is falsy, moves on)
console.log("value" || "default");   // "value" (first operand is truthy)
console.log(0 || "" || null || "last"); // "last" (all falsy until the end)
```

This is **short-circuiting**: the right-hand side is only evaluated if
needed, which makes both operators useful for conditional execution, not
just conditional values:

```js
const user = { loggedIn: true, greet: () => console.log("Welcome!") };
user.loggedIn && user.greet(); // only calls greet() if loggedIn is truthy

function getUser() { return null; }
const name = getUser() || "Guest"; // classic (but flawed) default-value pattern
```

The `|| "Guest"` pattern above has a bug: it treats *any* falsy value
(`0`, `""`, `false`) as "missing," not just `null`/`undefined`. That's
exactly the gap the nullish coalescing operator closes.

## 4.5 Nullish coalescing (`??`) — ES2020

`??` returns the right-hand operand **only when the left side is `null`
or `undefined`** — not for any other falsy value. This fixes the `||`
default-value bug:

```js
const count1 = 0;
console.log(count1 || 10); // 10 -- WRONG if 0 is a valid, meaningful value!
console.log(count1 ?? 10); // 0  -- correct, 0 is not null/undefined

const count2 = null;
console.log(count2 ?? 10); // 10 -- correctly falls back

function getConfig(options) {
  const retries = options.retries ?? 3; // 0 retries is respected; only null/undefined fall back
  return retries;
}
console.log(getConfig({ retries: 0 })); // 0
console.log(getConfig({}));               // 3
```

**Rule: use `??` for "give me a default if this is missing," and `||`
only when you genuinely want to treat every falsy value as "missing."**
Note: `??` cannot be directly mixed with `&&`/`||` without parentheses —
`a || b ?? c` is a `SyntaxError` by design, to prevent ambiguous
precedence bugs.

## 4.6 Optional chaining (`?.`) — ES2020

`?.` short-circuits to `undefined` instead of throwing when accessing a
property, calling a method, or indexing into something that is `null` or
`undefined`:

```js
const user = { profile: { name: "Alice" } };

console.log(user.profile?.name);        // "Alice"
console.log(user.address?.city);         // undefined -- no error, even though user.address doesn't exist
// console.log(user.address.city);       // TypeError: Cannot read properties of undefined

console.log(user.sayHi?.());              // undefined -- calls only if sayHi exists, else skips safely
console.log(user.profile?.tags?.[0]);      // undefined -- safe chained array access too

const arr = null;
console.log(arr?.[0]);                     // undefined, no crash
```

`?.` and `??` are often combined:

```js
const city = user.address?.city ?? "Unknown";
console.log(city); // "Unknown"
```

## 4.7 The ternary (conditional) operator

```js
const age = 20;
const category = age >= 18 ? "adult" : "minor";
console.log(category); // "adult"

// Ternaries can be chained, but this hurts readability past 1-2 levels:
const grade = 85;
const letter = grade >= 90 ? "A" : grade >= 80 ? "B" : grade >= 70 ? "C" : "F";
console.log(letter); // "B"
```

## 4.8 `typeof`, `instanceof`, `in`, and `delete`

```js
typeof 42;          // "number"
typeof "hi";          // "string"

const now = new Date();
now instanceof Date;    // true -- checks the prototype chain (Chapter 16)
[] instanceof Array;      // true
[] instanceof Object;      // true -- arrays are also objects

const obj = { name: "Alice" };
"name" in obj;               // true  -- checks if the key exists (own OR inherited)
"toString" in obj;             // true  -- inherited from Object.prototype
obj.hasOwnProperty("name");      // true  -- checks OWN properties only, not inherited

delete obj.name;                  // removes the property, returns true on success
console.log(obj);                   // {}
```

## 4.9 Bitwise operators

Less commonly used in everyday application code, but important for flags,
low-level work, and certain performance tricks:

```js
5 & 1;    // 1  AND  (0101 & 0001 = 0001)
5 | 1;    // 5  OR   (0101 | 0001 = 0101)
5 ^ 1;    // 4  XOR  (0101 ^ 0001 = 0100)
~5;       // -6 NOT  (inverts all bits)
5 << 1;   // 10 left shift  (multiply by 2)
5 >> 1;   // 2  right shift (divide by 2, floor)
-5 >>> 1; // large positive number -- unsigned right shift, ignores sign bit

// A common trick: double bitwise NOT truncates to a 32-bit integer, faster
// than Math.floor for positive numbers (rarely necessary, but seen in the wild):
~~4.7; // 4
```

## 4.10 Operator precedence

When operators combine, precedence determines evaluation order (higher
precedence binds tighter, evaluated first). You don't need to memorize
the full table, but know the common surprises:

```js
2 + 3 * 4;          // 14, not 20 -- * binds tighter than +
(2 + 3) * 4;         // 20 -- parentheses override precedence

true || false && false; // true -- && binds tighter than ||, evaluates as: true || (false && false)

typeof 1 + 1;          // "number1" !! -- typeof (higher precedence) runs first: (typeof 1) + 1 -> "number" + 1

let a, b;
a = b = 5;               // right-associative: b = 5, then a = (b's value) -> both are 5
```

**When in doubt, use parentheses.** They cost nothing and remove all
ambiguity for the next reader (including future you).

## 4.11 Chapter summary

- Prefer `===`/`!==` over `==`/`!=` always, except the `x == null` idiom.
- `&&` and `||` return operand values, not just booleans, and short-circuit
  — this powers common conditional-execution and default-value idioms.
- `??` is the correct default-value operator when `0`, `""`, or `false`
  should be treated as valid values (unlike `||`).
- `?.` prevents "Cannot read properties of undefined/null" errors by
  short-circuiting property/method/index access.
- `instanceof` checks the prototype chain; `in` checks for a key
  (including inherited ones); `hasOwnProperty` checks own keys only.
- When precedence is unclear, add parentheses — it's free and unambiguous.

## 4.12 Exercises

1. Without running it, predict the output of `"5" + 3 - 1` and
   `5 + 3 + "1"`, then verify with the example file.
2. Rewrite `const x = options.timeout || 5000;` to correctly allow a
   timeout of `0`, using the right operator.
3. Given `const user = {};`, write one line using `?.` and `??` together
   that safely reads `user.settings.theme` and falls back to `"light"`.
