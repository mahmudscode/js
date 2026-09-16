# Chapter 11 — Numbers and Math

## 11.1 There's only one number type

Unlike languages with separate `int`, `float`, `double`, and `long` types,
JavaScript has a single `number` type: a 64-bit floating-point number
following the **IEEE 754 double-precision** standard. `42` and `42.5` are
both just `number` under the hood.

```js
typeof 42;      // "number"
typeof 42.5;     // "number"
typeof NaN;       // "number" — yes, "Not a Number" is itself typed "number"
typeof Infinity;   // "number"
```

This design is simple but has real, learnable consequences: integer-only
languages don't have to worry about floating-point rounding error on every
arithmetic operation, but JavaScript does.

## 11.2 Floating-point precision: the `0.1 + 0.2` problem

```js
console.log(0.1 + 0.2);          // 0.30000000000000004  — NOT 0.3!
console.log(0.1 + 0.2 === 0.3);   // false
```

This isn't a JavaScript bug — it's a consequence of IEEE 754 binary
floating point, shared by nearly every mainstream language (Python, Java,
C, Go all show the same behavior). Some fractions (like 0.1) cannot be
represented exactly in binary, the same way 1/3 cannot be represented
exactly in decimal. The fix is to never compare floats for exact equality;
instead, check if they're close enough:

```js
function approximatelyEqual(a, b, epsilon = Number.EPSILON * 100) {
  return Math.abs(a - b) < epsilon;
}
console.log(approximatelyEqual(0.1 + 0.2, 0.3)); // true
```

For money, prefer working in integer cents (`1050` instead of `10.50`) or
use `BigInt`/a decimal library, rather than floating-point dollars.

## 11.3 Integer safety limits

```js
Number.MAX_SAFE_INTEGER;  // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER;  // -9007199254740991

console.log(Number.MAX_SAFE_INTEGER + 1); // 9007199254740992 — correct
console.log(Number.MAX_SAFE_INTEGER + 2); // 9007199254740992 — WRONG!
                                           // (should be ...993, but
                                           // precision is lost beyond
                                           // the safe integer range)

Number.isSafeInteger(9007199254740991);    // true
Number.isSafeInteger(9007199254740992);     // false
```

Beyond `MAX_SAFE_INTEGER`, integers can no longer be represented uniquely
— multiple mathematically distinct integers collapse to the same floating
point value. This matters for things like database IDs from systems that
use 64-bit integers (e.g., Twitter/X snowflake IDs, some database
auto-increment columns) — those should be handled as strings or `BigInt`
in JavaScript, never as regular numbers.

## 11.4 `NaN`: "Not a Number"

`NaN` represents a failed or undefined numeric operation, and it has one
famously bizarre property: **it is the only value in JavaScript that is
not equal to itself.**

```js
console.log(0 / 0);          // NaN
console.log("abc" * 2);       // NaN
console.log(NaN === NaN);      // false!
console.log(NaN == NaN);        // false too — no coercion rescues this

// Correct ways to test for NaN:
console.log(Number.isNaN(NaN));       // true — the ONLY reliable check
console.log(isNaN(NaN));               // true

console.log(isNaN("hello"));            // true — DANGER: global isNaN()
                                         // coerces its argument to a number
                                         // first ("hello" -> NaN -> true)
console.log(Number.isNaN("hello"));      // false — Number.isNaN does NOT
                                          // coerce; "hello" is not the
                                          // NaN value, so it's false
```

**Always prefer `Number.isNaN()` over the global `isNaN()`** — the global
version's implicit coercion produces `true` for any non-numeric,
non-convertible value, which is almost never what you actually want to ask.

## 11.5 Useful `Number` methods and properties

```js
Number.isInteger(42);      // true
Number.isInteger(42.5);     // false
Number.isFinite(42);         // true — does NOT coerce (unlike global isFinite)
Number.isFinite(Infinity);    // false
Number.parseInt("42px");       // same as global parseInt, namespaced
Number.parseFloat("3.14");      // same as global parseFloat, namespaced

(1234.5678).toFixed(2);          // "1234.57" — returns a STRING, rounds
(0.1).toFixed(20);                 // "0.10000000000000000555" — reveals
                                    // the underlying floating-point
                                    // imprecision
(1234.5678).toPrecision(6);         // "1234.57" — total significant digits
```

## 11.6 The `Math` object

`Math` is a built-in object (not a constructor — you never write
`new Math()`) bundling constants and functions for common numeric
operations.

```js
Math.round(4.5);    // 5  — rounds half up
Math.round(-4.5);     // -4 — careful, rounds toward +Infinity on ties, not
                       //      "away from zero" as many expect
Math.floor(4.9);       // 4  — always rounds down
Math.ceil(4.1);          // 5  — always rounds up
Math.trunc(4.9);           // 4  — chops off the decimal, no rounding logic
Math.trunc(-4.9);            // -4 — unlike floor(-4.9) which is -5

Math.abs(-7);           // 7
Math.pow(2, 10);          // 1024 (same as 2 ** 10)
Math.sqrt(64);              // 8
Math.cbrt(27);                // 3
Math.min(4, 1, 9, -2);          // -2
Math.max(4, 1, 9, -2);           // 9
Math.min(...[4, 1, 9, -2]);       // -2 — spread an array into min/max
Math.PI;                            // 3.141592653589793
Math.E;                              // 2.718281828459045
Math.random();                        // a float in [0, 1)
```

### Generating random integers in a range

```js
// Random integer between min (inclusive) and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
randomInt(1, 6); // simulate a dice roll: 1, 2, 3, 4, 5, or 6
```

## 11.7 BigInt: when numbers aren't enough

`BigInt` (ES2020) is a second numeric type for arbitrary-precision
integers, created by appending `n` to an integer literal or calling
`BigInt()`:

```js
const huge = 9007199254740993n;   // BigInt literal
const alsoHuge = BigInt("9007199254740993");
console.log(huge + 10n);           // 9007199254741003n — exact, no rounding

console.log(typeof huge);            // "bigint" — a genuinely different type

// BigInt and Number CANNOT be mixed directly — this throws:
// console.log(huge + 1);            // TypeError: Cannot mix BigInt and
                                       // other types
console.log(huge + BigInt(1));         // must convert explicitly
console.log(Number(huge) + 1);           // or convert the BigInt down,
                                           // losing precision if it's huge
```

Use `BigInt` for things like cryptography, very large ID numbers, or exact
integer arithmetic beyond `Number.MAX_SAFE_INTEGER` — not for everyday
math, since it's slower and can't represent fractions at all.

## 11.8 Formatting numbers for humans

```js
(1234567.891).toLocaleString();
// "1,234,567.891" (in en-US locale — varies by locale!)

new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(1234.5);
// "$1,234.50"

new Intl.NumberFormat("de-DE").format(1234567.891);
// "1.234.567,891" — German locale uses '.' and ',' swapped from US

new Intl.NumberFormat("en-US", { style: "percent" }).format(0.756);
// "76%"
```

`Intl.NumberFormat` is the correct, locale-aware way to display numbers,
currency, and percentages to users — manual string manipulation
(inserting commas by hand) breaks for non-US locales and is easy to get
wrong for edge cases like negative numbers.

## 11.9 Chapter summary

- JavaScript has one `number` type: a 64-bit IEEE 754 double. There is no
  separate integer type (unless you use `BigInt`).
- Floating-point arithmetic is imprecise by nature (`0.1 + 0.2 !== 0.3`);
  never compare floats for exact equality, and use integer cents or
  `BigInt`/decimal libraries for money.
- `Number.MAX_SAFE_INTEGER` (2^53 - 1) is the largest integer JS can
  represent exactly; beyond it, precision silently degrades.
- Always use `Number.isNaN()`, never the coercing global `isNaN()`.
- `Math` provides rounding, power/root, min/max, and random functions;
  combine `Math.random()` and `Math.floor()` for random integers.
- `BigInt` handles arbitrary-precision integers but cannot mix with
  regular numbers without explicit conversion.
- `Intl.NumberFormat` is the correct tool for locale-aware number,
  currency, and percentage display.

## 11.10 Exercises

1. Write `randomInt(min, max)` (inclusive on both ends) and use it to
   simulate rolling two six-sided dice 10,000 times, then log how many
   times the total was 7.
2. Explain why `(0.1 + 0.2).toFixed(1) === "0.3"` returns `true` even
   though `0.1 + 0.2 === 0.3` returns `false`.
3. Format `1234567.891` as USD currency and as a German-locale number
   using `Intl.NumberFormat`, and compare the results.
