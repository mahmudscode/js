# Chapter 25 — JSON and Web Storage

## 25.1 What JSON actually is

**JSON** (JavaScript Object Notation) is a text-based data format inspired
by JavaScript object literal syntax, but it is important to understand
that JSON is a *language-independent* data format, not JavaScript code.
Every major programming language has a JSON parser, which is exactly why
JSON became the universal data-interchange format for web APIs.

Because JSON is not literally JavaScript, its syntax rules are **stricter**
than a JS object literal:

| Rule | JS object literal | JSON |
|---|---|---|
| Keys | Can be unquoted (`{a: 1}`) | Must be double-quoted strings (`{"a": 1}`) |
| Strings | Single or double quotes | Double quotes only |
| Trailing commas | Allowed in modern JS | **Not allowed** |
| Comments | Allowed | **Not allowed** |
| Functions/`undefined` | Allowed as values | **Not allowed** |
| Keys must be | Identifiers or strings | Always strings |

```json
{
  "name": "Ada Lovelace",
  "born": 1815,
  "isProgrammer": true,
  "languages": ["Analytical Engine notes"],
  "spouse": null
}
```

This is **valid JSON**. Each of the following is **invalid JSON** and will
fail to parse, even though each looks like perfectly normal JavaScript:

```js
{ name: "Ada" }              // ❌ unquoted key
{ "name": 'Ada' }            // ❌ single-quoted string
{ "name": "Ada", }           // ❌ trailing comma
{ "greet": function () {} }  // ❌ functions aren't JSON values
```

## 25.2 `JSON.stringify` — turning JS values into JSON text

```js
const user = { name: "Ada", born: 1815, active: true };
JSON.stringify(user);
// '{"name":"Ada","born":1815,"active":true}'
```

`JSON.stringify` accepts two additional arguments beyond the value:
`JSON.stringify(value, replacer, space)`.

### The `space` argument — pretty-printing

```js
JSON.stringify(user, null, 2);
// {
//   "name": "Ada",
//   "born": 1815,
//   "active": true
// }
```

`space` can be a number (spaces of indentation, up to 10) or a string
(e.g. `"\t"`), and is purely cosmetic — extremely useful for logging,
config files, or anything a human will read.

### The `replacer` argument — filtering or transforming

`replacer` can be an **array of keys to keep**:

```js
JSON.stringify(user, ["name", "active"]);
// '{"name":"Ada","active":true}'
```

...or a **function** called for every key/value pair (including the root
object itself, under the key `""`), letting you transform or omit values:

```js
JSON.stringify(user, (key, value) => {
  if (key === "born") return undefined; // omit this key entirely
  return value;
});
// '{"name":"Ada","active":true}'
```

### What gets skipped or converted automatically

- `undefined`, functions, and Symbols are **omitted** if they're object
  property values, and become `null` if they're array elements.
- `NaN` and `Infinity` are converted to `null`.
- `Date` objects are converted to ISO 8601 strings automatically (because
  `Date` has a built-in `toJSON` method — see below).

```js
JSON.stringify({ a: undefined, b: () => {}, c: NaN, d: [undefined, 1] });
// '{"c":null,"d":[null,1]}'   -> a and b vanish, undefined in an array becomes null
```

### Custom serialization with `toJSON`

If a value has a `.toJSON()` method, `JSON.stringify` calls it and
serializes *its* return value instead of the object itself. This is how
`Date` produces ISO strings, and you can use the same hook for your own
classes:

```js
class Money {
  constructor(cents) {
    this.cents = cents;
  }
  toJSON() {
    return `$${(this.cents / 100).toFixed(2)}`;
  }
}

JSON.stringify({ price: new Money(1999) });
// '{"price":"$19.99"}'
```

### Circular references throw

`JSON.stringify` walks the object graph recursively, so an object that
(directly or indirectly) references itself throws a `TypeError`:

```js
const a = { name: "a" };
a.self = a;
JSON.stringify(a);
// TypeError: Converting circular structure to JSON
```

There is no built-in fix — you either write a custom replacer that tracks
visited objects and substitutes something like `"[Circular]"`, or use a
library (e.g. `flatted`) designed for this.

## 25.3 `JSON.parse` — turning JSON text into JS values

```js
const text = '{"name":"Ada","born":1815,"active":true}';
const user = JSON.parse(text);
console.log(user.name); // "Ada"
```

Malformed JSON throws a `SyntaxError` — always wrap untrusted input in a
`try/catch`:

```js
function safeParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON:", err.message);
    return fallback;
  }
}
```

`JSON.parse` also accepts an optional **reviver** function, called bottom-up
for every key/value pair, letting you transform values as they're parsed —
a common use is reviving ISO date strings back into real `Date` objects:

```js
const revived = JSON.parse(text, (key, value) => {
  if (key === "createdAt") return new Date(value);
  return value;
});
```

## 25.4 Deep cloning with JSON (and why it has limits)

A very common trick for a quick deep clone of "plain data" is:

```js
const clone = JSON.parse(JSON.stringify(original));
```

This works, but only for values JSON itself can represent. It **silently
loses**: `undefined` values, functions, `Date` objects (become strings,
not `Date` instances again, unless you use a reviver), `Map`/`Set`,
`RegExp`, and it throws on circular references. For real deep-cloning
needs, prefer the built-in `structuredClone()` (available in modern
browsers and Node 17+), which handles all of these correctly.

## 25.5 `localStorage` and `sessionStorage`

These are **browser-only** APIs — they do not exist in Node.js at all
(`typeof localStorage` in a Node script is `"undefined"`). They let a web
page persist small amounts of string data on the user's machine.

```js
// Only works in a browser (or a browser-like environment)
localStorage.setItem("theme", "dark");
localStorage.getItem("theme");     // "dark"
localStorage.removeItem("theme");
localStorage.clear();              // wipes everything for this origin
localStorage.length;                // number of stored keys
localStorage.key(0);                // the first key's name
```

### `localStorage` vs. `sessionStorage`

| | `localStorage` | `sessionStorage` |
|---|---|---|
| Lifetime | Persists until explicitly cleared | Cleared when the tab/window closes |
| Shared across tabs? | Yes, for the same origin | No — each tab gets its own |
| Typical use | "Remember my theme preference" | "Keep this multi-step form's progress" |

### Storing objects: you must JSON-encode them yourself

Both storages only store **strings** — passing a non-string silently calls
`.toString()` on it (so an object becomes the useless string
`"[object Object]"`). Always go through `JSON.stringify`/`JSON.parse`:

```js
const prefs = { theme: "dark", fontSize: 14 };
localStorage.setItem("prefs", JSON.stringify(prefs));

const stored = JSON.parse(localStorage.getItem("prefs") ?? "{}");
console.log(stored.theme); // "dark"
```

### Limits and scoping

- Storage is **origin-scoped** — `https://a.com` cannot read
  `https://b.com`'s storage, and even `http://a.com` and `https://a.com`
  count as different origins.
- Browsers typically cap total storage per origin around **5–10 MB**
  (varies by browser) — plenty for preferences and cached small datasets,
  not for large files or "offline databases" (for that, look at
  IndexedDB, which is outside this book's scope).
- All storage APIs are **synchronous**, which means large read/writes can
  briefly block the main thread — another reason to keep stored data small.

### A brief note on cookies, for contrast

Before `localStorage` existed (it arrived with HTML5 / ES5-era browsers),
the only client-side storage was **cookies**. Cookies are still used
today, but for a different purpose: unlike `localStorage`, cookies are
automatically sent to the server with every matching HTTP request, have a
much smaller size limit (~4 KB), and support an expiration date and
security flags (`HttpOnly`, `Secure`, `SameSite`) relevant to
authentication. Rule of thumb: use cookies for data the *server* needs to
see on every request (like a session ID); use `localStorage`/
`sessionStorage` for data only the *client* needs.

## 25.6 Chapter summary

- JSON is a strict, language-independent text format: double-quoted keys
  and strings only, no trailing commas, no comments, no functions.
- `JSON.stringify(value, replacer, space)` serializes JS values to JSON
  text; `replacer` filters/transforms, `space` pretty-prints.
- Objects with a `.toJSON()` method control their own serialization (this
  is how `Date` becomes an ISO string automatically).
- `JSON.stringify` throws on circular references and silently drops
  `undefined`/functions/Symbols.
- `JSON.parse(text, reviver)` parses JSON text back into JS values, and
  always throws `SyntaxError` on malformed input — wrap it in `try/catch`.
- `localStorage`/`sessionStorage` are browser-only, string-only,
  origin-scoped storage APIs — encode objects with `JSON.stringify` before
  storing them and `JSON.parse` after retrieving them.

## 25.7 Exercises

1. Run `examples/25-json-and-web-storage.js` and read through each
   section's output.
2. Write a `replacer` function that redacts any key literally named
   `"password"` by replacing its value with `"***"` before stringifying.
3. Try `JSON.parse("{invalid}")` in a `try/catch` and print a friendly
   error message instead of letting it crash your program.

---

**Trying the storage APIs (browser only):** open any web page's DevTools
console and run:

```js
localStorage.setItem("greeting", JSON.stringify({ hello: "world" }));
console.log(JSON.parse(localStorage.getItem("greeting")));
// { hello: "world" }
```

You can also inspect stored values visually in DevTools under
**Application → Storage → Local Storage** (Chrome) or
**Storage → Local Storage** (Firefox).
