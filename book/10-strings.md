# Chapter 10 — Strings

## 10.1 String basics and immutability

Strings represent text and are one of JavaScript's primitive types. A
critical fact: **strings are immutable** — no method ever changes a string
in place. Every string operation returns a brand-new string.

```js
let greeting = "hello";
greeting[0] = "H";           // silently does nothing (non-strict mode)
console.log(greeting);        // "hello" — unchanged

greeting = greeting.toUpperCase(); // reassigning with a NEW string
console.log(greeting);              // "HELLO"
```

Because strings can't be mutated, methods like `.trim()`, `.replace()`, and
`.slice()` always return a new string that you must capture (assign or use
directly) — calling `str.trim()` and throwing away the result does nothing.

## 10.2 Creating strings: quotes and template literals

```js
const single = 'hello';
const double = "hello";
const template = `hello`; // template literal (ES2015, backticks)
```

Single and double quotes are functionally identical — pick one convention
and stick with it (this book uses double quotes for simple strings).
Template literals unlock two features single/double quotes can't do:

**Interpolation** — embed expressions directly with `${...}`:

```js
const name = "Wole";
const age = 30;
console.log(`${name} is ${age} years old, born in ${2026 - age}.`);
// "Wole is 30 years old, born in 1996."
```

**Multi-line strings** — no more `"line1\n" + "line2"` concatenation:

```js
const message = `Dear customer,

Thank you for your order.
Regards,
The Team`;
```

### Tagged templates

A function placed immediately before a template literal receives the
string parts and interpolated values separately, letting you post-process
the whole thing — this is how libraries like `styled-components` and
`graphql-tag` work:

```js
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] !== undefined ? `**${values[i]}**` : "";
    return result + str + value;
  }, "");
}

const item = "laptop", price = 999;
console.log(highlight`The ${item} costs ${price} dollars.`);
// "The **laptop** costs **999** dollars."
```

## 10.3 Common string methods

```js
const s = "  Hello, World!  ";

s.trim();                 // "Hello, World!" (removes leading/trailing whitespace)
s.trimStart(); s.trimEnd(); // one-sided trims

s.toUpperCase();           // "  HELLO, WORLD!  "
s.toLowerCase();           // "  hello, world!  "

const text = "Hello, World!";
text.length;               // 13
text.slice(7, 12);         // "World" (start inclusive, end exclusive)
text.slice(-6);             // "World!" (negative = from the end)
text.substring(7, 12);      // "World" (like slice, but no negative support,
                             // and swaps args if start > end instead of
                             // returning "" — slice is generally preferred)
text.split(", ");           // ["Hello", "World!"]
text.replace("World", "JS"); // "Hello, JS!" (replaces FIRST match only)
text.replaceAll("l", "L");   // "HeLLo, WorLd!" (ES2021, replaces ALL matches)
text.includes("World");      // true
text.startsWith("Hello");    // true
text.endsWith("!");          // true
text.indexOf("o");           // 4 (first occurrence)
text.lastIndexOf("o");       // 8
text.charAt(0);              // "H"
text[0];                     // "H" (bracket access also works, read-only)
text.padStart(15, "*");      // "**Hello, World!"
text.padEnd(15, "*");        // "Hello, World!**"
"ab".repeat(3);              // "ababab"
```

`replace`/`replaceAll` also accept a regular expression as the first
argument and a function as the second (covered fully in Chapter 26):

```js
"2026-09-16".replace(/(\d+)-(\d+)-(\d+)/, "$3/$2/$1"); // "16/09/2026"
```

## 10.4 Converting between strings and numbers

There are several ways to convert a string to a number, and they don't
all behave the same on edge cases — a common source of subtle bugs.

```js
Number("42");        // 42
Number("42px");       // NaN — Number() requires the ENTIRE string to be numeric
Number("");            // 0   — surprising! empty string converts to 0
Number("  42  ");      // 42  — whitespace is trimmed
Number(null);           // 0   — another surprise
Number(undefined);       // NaN

parseInt("42px");        // 42  — parseInt reads as many leading digits as it can
parseInt("px42");         // NaN — but stops immediately if it can't start
parseInt("3.99");          // 3   — parseInt ignores everything after the decimal
parseFloat("3.99abc");      // 3.99 — parseFloat keeps the decimal portion

+"42";                       // 42   — unary plus, same rules as Number()
+"42px";                      // NaN

"42" * 1;                      // 42 — multiplying by 1 also coerces
```

**Practical guidance**: use `Number(str)` when you want strict "is this
entirely a valid number" behavior, and `parseInt(str, 10)` /
`parseFloat(str)` when you're deliberately extracting a leading number from
a larger string (like `"42px"` from CSS). **Always pass a radix (`10`) to
`parseInt`** — `parseInt("08")` without a radix has historically caused
bugs on some engines interpreting leading-zero numbers as octal.

Going the other direction, number-to-string:

```js
String(42);          // "42"
(42).toString();       // "42"
(42).toString(2);       // "101010" — base-2 (binary) representation
(255).toString(16);      // "ff" — hexadecimal
`${42}`;                  // "42" — template literal implicit conversion
```

## 10.5 Unicode, UTF-16, and string length surprises

JavaScript strings are sequences of UTF-16 code units, not "characters" in
the way humans think of them. Most common characters (Latin letters,
digits, basic punctuation) fit in a single 16-bit code unit, but many
emoji, some CJK (Chinese/Japanese/Korean) characters, and other symbols
outside the "Basic Multilingual Plane" require **two** code units — a
"surrogate pair." This means `.length` can lie about the number of visible
characters:

```js
console.log("hello".length);  // 5 — as expected
console.log("😀".length);      // 2 — ONE emoji, but TWO UTF-16 code units!
console.log("café".length);    // 4 — fine, é fits in one code unit

const smiley = "😀";
console.log([...smiley].length);        // 1 — spreading into an array of
                                          // code POINTS gets this right
console.log(Array.from(smiley).length);   // 1 — same idea, Array.from is
                                            // iterable-aware
console.log(smiley[0]);                    // an unpaired surrogate (broken glyph!)
console.log([...smiley][0]);                // the correct, whole emoji
```

**Practical rule**: when counting or slicing user-facing text that might
contain emoji or non-BMP characters, iterate with `for...of` or spread
(`[...str]`) rather than indexing/`.length` directly, because those
iterate by *code point*, not raw UTF-16 unit.

## 10.6 Comparing strings

```js
"apple" < "banana";    // true — lexicographic (dictionary) comparison
"Apple" < "apple";      // true — uppercase letters sort BEFORE lowercase
                         // in ASCII/UTF-16 ('A' is 65, 'a' is 97)

"apple".localeCompare("banana"); // -1 (locale-aware, handles accents/case
                                  //     more sensibly than < >)
["Banana", "apple", "Cherry"].sort((a, b) => a.localeCompare(b));
// ["apple", "Banana", "Cherry"] — sensible alphabetical order
["Banana", "apple", "Cherry"].sort();
// ["Banana", "Cherry", "apple"] — naive sort, capital letters sort first!
```

## 10.7 Building HTML/SQL from strings: a security note

It's tempting to build HTML or SQL by concatenating strings or using
template literals with user input directly:

```js
// DANGEROUS — if `username` comes from user input, this is an XSS hole
const html = `<div>Welcome, ${username}!</div>`;
element.innerHTML = html; // an attacker could set username to
                           // "<img src=x onerror=alert(1)>"

// DANGEROUS — never build SQL with string interpolation; this is a
// textbook SQL injection vulnerability
const query = `SELECT * FROM users WHERE name = '${username}'`;
```

The fix is never "escape it by hand" — use the platform's safe APIs
instead: `element.textContent` (not `innerHTML`) for inserting plain text
into the DOM (Chapter 27), and parameterized queries / prepared statements
for SQL (`db.query("SELECT * FROM users WHERE name = ?", [username])`),
which every real database driver supports.

## 10.8 Chapter summary

- Strings are immutable; every method returns a new string rather than
  modifying the original.
- Template literals (backticks) support interpolation (`${expr}`),
  multi-line text, and tagged template functions for custom processing.
- `Number()`, `parseInt()`, and `parseFloat()` have different edge-case
  behaviors when converting strings to numbers — choose deliberately.
- `.length` counts UTF-16 code units, not visible characters — spread
  (`[...str]`) or `for...of` to iterate correctly over emoji/non-BMP text.
- Never build HTML or SQL via raw string interpolation of user input —
  use `textContent`/safe DOM APIs and parameterized database queries.

## 10.9 Exercises

1. Write a function `truncate(str, maxLength)` that shortens a string to
   `maxLength` characters and appends `"..."` if it was truncated, being
   careful not to split a surrogate pair in half.
2. Predict the output of `Number("")`, `Number(" ")`, and `Number("  1  ")`
   before running `examples/10-strings.js` to check.
3. Explain why `["Banana", "apple"].sort()` doesn't give "sensible"
   alphabetical order, and fix it two different ways.
