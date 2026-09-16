# Chapter 26 — Regular Expressions

## 26.1 What regular expressions are for

A **regular expression** (regex) is a pattern used to match, extract, or
replace text. Instead of writing manual loops that check characters one by
one, you describe *the shape* of what you're looking for — "a sequence of
digits," "an optional plus sign followed by digits," "anything between
quotes" — and the regex engine does the searching.

Regexes are extremely powerful for text processing, but they are also
famous for becoming unreadable quickly. This chapter teaches the syntax
you'll actually use day to day, and is equally honest about when *not* to
reach for a regex.

## 26.2 Creating a regex: literal vs. constructor

```js
// Literal syntax — most common, pattern known at write-time
const re1 = /hello/;

// Constructor syntax — needed when building a pattern dynamically
const word = "hello";
const re2 = new RegExp(word);

// Constructor also accepts flags as a second argument
const re3 = new RegExp(word, "gi");
```

Use the literal form whenever the pattern is fixed; use `RegExp(...)` only
when you need to build the pattern from a variable at runtime (e.g.,
searching for user-provided text).

## 26.3 Flags

Flags go after the closing slash (`/pattern/flags`) and change how the
whole regex behaves:

| Flag | Meaning |
|---|---|
| `g` | Global — find **all** matches, not just the first |
| `i` | Case-insensitive |
| `m` | Multiline — `^`/`$` match the start/end of each line, not just the whole string |
| `s` | Dotall — `.` also matches newlines (normally it doesn't) |
| `u` | Unicode — treat the pattern/string as full Unicode code points |
| `y` | Sticky — match only starting at `lastIndex`, no scanning ahead |

```js
/hello/i.test("Hello world");  // true — case-insensitive
"a1 b2 c3".match(/\d/g);       // ["1", "2", "3"] — all matches, not just the first
```

## 26.4 Character classes and metacharacters

| Pattern | Matches |
|---|---|
| `.` | Any character except newline (unless `s` flag) |
| `\d` | A digit (`[0-9]`) |
| `\D` | A non-digit |
| `\w` | A "word" character (`[A-Za-z0-9_]`) |
| `\W` | A non-word character |
| `\s` | Whitespace (space, tab, newline) |
| `\S` | Non-whitespace |
| `[abc]` | Any one of `a`, `b`, or `c` |
| `[^abc]` | Any character **except** `a`, `b`, `c` |
| `[a-z]` | Any character in the range `a` to `z` |
| `\.` `\(` `\$` etc. | An escaped literal metacharacter |

```js
/\d{3}-\d{4}/.test("555-1234");  // true
/[aeiou]/.test("sky");           // false — no vowels
```

## 26.5 Quantifiers — how many times

| Pattern | Meaning |
|---|---|
| `*` | 0 or more |
| `+` | 1 or more |
| `?` | 0 or 1 (optional) |
| `{n}` | Exactly `n` times |
| `{n,}` | `n` or more times |
| `{n,m}` | Between `n` and `m` times |

By default quantifiers are **greedy** — they consume as much as possible,
then backtrack if needed. Appending `?` makes them **lazy** — they consume
as little as possible:

```js
"<a><b>".match(/<.+>/)[0];   // "<a><b>"  — greedy, spans both tags
"<a><b>".match(/<.+?>/)[0];  // "<a>"     — lazy, stops at the first ">"
```

## 26.6 Anchors and boundaries

```js
/^hello/    // matches only at the start of the string (or line, with /m)
/world$/    // matches only at the end of the string (or line, with /m)
/\bcat\b/   // \b is a word boundary — matches "cat" but not "category"
```

```js
/^cat$/.test("cat");       // true  — the entire string is exactly "cat"
/^cat$/.test("concat");    // false — anchors pin start and end
/\bcat\b/.test("concat");  // false — "cat" inside "concat" has no word boundary
/\bcat\b/.test("a cat!");  // true
```

## 26.7 Groups

**Capturing groups** `(...)` let you extract sub-matches:

```js
const match = "2024-01-15".match(/(\d{4})-(\d{2})-(\d{2})/);
console.log(match[0]); // "2024-01-15" — the whole match
console.log(match[1]); // "2024"       — first group
console.log(match[2]); // "01"
console.log(match[3]); // "15"
```

**Non-capturing groups** `(?:...)` group for alternation/quantifiers
without creating a numbered capture:

```js
/(?:Mr|Mrs|Ms)\. \w+/.test("Mrs. Smith"); // true, but no extra capture group
```

**Named groups** `(?<name>...)` are far more readable than numbered ones
in complex patterns:

```js
const { groups } = "2024-01-15".match(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
);
console.log(groups.year, groups.month, groups.day); // 2024 01 15
```

## 26.8 Matching methods

| Method | Called on | Returns |
|---|---|---|
| `regex.test(str)` | RegExp | `true`/`false` |
| `regex.exec(str)` | RegExp | Match array or `null`; with `/g`, advances `lastIndex` each call |
| `str.match(regex)` | String | Like `exec` (no `/g`), or all matches as a plain array (with `/g`, but no groups) |
| `str.matchAll(regex)` | String | An iterator of **every** match, each with full group info (requires `/g`) |
| `str.replace(regex, replacement)` | String | New string with matches replaced (only first match unless `/g`) |
| `str.replaceAll(regex, replacement)` | String | New string, all matches replaced (regex **must** have `/g`) |
| `str.split(regex)` | String | Array split on matches |

### `exec` in a loop (manual global iteration)

```js
const re = /\d+/g;
let m;
while ((m = re.exec("a1 b22 c333")) !== null) {
  console.log(m[0], "at index", m.index);
}
// "1" at index 1
// "22" at index 4
// "333" at index 8
```

### `matchAll` — the modern, safer alternative

```js
for (const m of "a1 b22 c333".matchAll(/\d+/g)) {
  console.log(m[0], "at index", m.index);
}
```

`matchAll` avoids the classic `exec`-in-a-loop bug where forgetting the
`g` flag causes an **infinite loop** (because `lastIndex` never advances).

### Replacing with capture groups

```js
"2024-01-15".replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1");
// "01/15/2024"   -- $1, $2, $3 refer to capture groups

"2024-01-15".replace(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/,
  "$<month>/$<day>/$<year>"
);
// "01/15/2024"   -- named group references
```

Replacement can also be a **function**, called for each match:

```js
"price: 5, qty: 3".replace(/\d+/g, (match) => String(Number(match) * 2));
// "price: 10, qty: 6"
```

## 26.9 Practical patterns

```js
// Trim whitespace (built-in String.trim() is better, but shown for the pattern):
"  hi  ".replace(/^\s+|\s+$/g, "");  // "hi"

// Extract all numbers from a string:
"Order #123 has 4 items at $5.99".match(/\d+(\.\d+)?/g);
// ["123", "4", "5.99"]

// Split on multiple delimiters (comma, semicolon, or whitespace):
"a, b; c   d".split(/[,;\s]+/).filter(Boolean);
// ["a", "b", "c", "d"]

// Check if a string is only digits:
/^\d+$/.test("12345"); // true
/^\d+$/.test("123a5"); // false

// Replace multiple spaces with a single space:
"too    many   spaces".replace(/\s+/g, " ");
```

### A word of caution on "validating" emails

A regex like `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` catches obviously malformed
input, but the actual email specification (RFC 5322) is far too complex to
fully validate with a regex that stays readable. In real applications,
use a light regex to catch typos early in the UI, and always confirm real
validity by **sending a confirmation email** — that's the only actual
proof an address is deliverable.

## 26.10 When *not* to use a regex

- **Parsing structured formats like HTML, JSON, or CSV with embedded
  quotes/commas.** These formats have nesting and escaping rules regex
  cannot reliably handle — use a real parser (`JSON.parse`, a DOM parser,
  a CSV library).
- **When a simple string method does the job.** `str.includes("foo")`,
  `str.startsWith("foo")`, and `str.split(",")` are faster to read and
  faster to run than the equivalent regex.
- **Extremely complex patterns nobody else can read six months later.**
  If a regex needs a paragraph of comments to explain, consider breaking
  it into named pieces, using named groups, or writing a small manual
  parser instead.

### Catastrophic backtracking

Certain patterns — typically **nested quantifiers** like `(a+)+b` — can
cause the regex engine's backtracking to explode exponentially on
certain inputs, freezing your program. This is a real, exploitable
denial-of-service vector (ReDoS) if you ever run a regex against untrusted
user input. Prefer non-backtracking-friendly patterns (avoid nested
`+`/`*` around overlapping character sets), test with adversarial inputs,
or use a regex complexity linter in CI for public-facing input validation.

## 26.11 Chapter summary

- Regexes describe text patterns using literals (`/pattern/flags`) or
  `new RegExp(str, flags)` when built dynamically.
- Flags (`g`, `i`, `m`, `s`, `u`, `y`) change matching behavior globally.
- Character classes (`\d`, `\w`, `\s`, `[...]`), quantifiers
  (`*`, `+`, `?`, `{n,m}`), and anchors (`^`, `$`, `\b`) are the core
  building blocks.
- Groups can be capturing `(...)`, non-capturing `(?:...)`, or named
  `(?<name>...)`.
- Prefer `matchAll` over manual `exec` loops to avoid the classic
  "forgot the `g` flag, infinite loop" bug.
- Regex is powerful but not always the right tool — avoid it for nested/
  structured formats, and be careful with untrusted input and
  catastrophic backtracking.

## 26.12 Exercises

1. Run `examples/26-regular-expressions.js` and study each section.
2. Write a regex that extracts all hashtags (`#word`) from a string like
   `"loving #javascript and #regex today"`.
3. Write a regex (with named groups) that parses a simple `"HH:MM"` time
   string into hours and minutes, and reject strings like `"25:99"` by
   constraining the digit ranges as tightly as plain regex reasonably
   allows.
