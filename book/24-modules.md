# Chapter 24 — Modules

## 24.1 The problem modules solve

Every non-trivial program needs to be split across multiple files. Without
a module system, JavaScript's only tool for sharing code between files was
the **global scope**: you loaded several `<script>` tags in a row, and
every variable declared at the top level of any of them became a property
of `window`, visible to every other script on the page.

```html
<script src="utils.js"></script>
<script src="cart.js"></script>
<script src="app.js"></script>
```

This works for tiny pages, but it breaks down fast in real applications:

- **Naming collisions.** If `utils.js` and `cart.js` both declare a
  top-level `function total() {}`, the second one silently overwrites the
  first. There is no error — just a bug that surfaces later.
- **No explicit dependencies.** Nothing in `app.js` states "I need
  `cart.js`'s `Cart` class." You only find out by reading the `<script>`
  tag order in the HTML, which is easy to get wrong as the project grows.
- **No privacy.** Every variable is global by default. A helper function
  meant to be an internal implementation detail of `utils.js` is just as
  exposed as the public API you intended other files to use.
- **Load-order fragility.** If someone reorders the `<script>` tags, or a
  build tool concatenates files in a different order, things break in ways
  that are hard to trace.

## 24.2 The pre-module workaround: the IIFE pattern

Before ES2015 gave JavaScript real modules, the community's best answer to
"global scope pollution" was the **Immediately Invoked Function Expression
(IIFE)**, often called the "module pattern." A function creates its own
private scope, and you deliberately export only what you want public by
attaching it to a single global object:

```js
// utils.js — old-school module pattern
var MyApp = MyApp || {};

MyApp.utils = (function () {
  // everything in here is private — not visible outside this IIFE
  function formatCurrency(cents) {
    return "$" + (cents / 100).toFixed(2);
  }

  function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-");
  }

  // explicitly expose only what should be public
  return { formatCurrency, slugify };
})();

// another file, loaded after utils.js
console.log(MyApp.utils.formatCurrency(1999)); // "$19.99"
```

This pattern is worth recognizing because you'll still encounter it in
older codebases, and because it demonstrates the core idea every later
module system formalizes: **wrap code in its own scope, and export an
explicit public interface.** What changed over time is *how* that wrapping
and exporting happens, and whether the loading of dependencies is handled
for you.

## 24.3 CommonJS (Node.js's original module system)

When Node.js was created in 2009, ES modules didn't exist yet in the
language. Node adopted **CommonJS (CJS)**, a synchronous, file-based module
system that is still the default in plain `.js` files in Node today (unless
your project opts into ES modules — see §24.7).

### Exporting with CommonJS

Every CommonJS file has an implicit `module.exports` object (initially
`{}`) that represents what the file makes available to other files.

```js
// math.js
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
// or, exporting one thing at a time:
// exports.add = add;
// exports.multiply = multiply;
```

`exports` is just a shorthand reference to `module.exports` — **do not**
reassign `exports = {...}` directly (that breaks the reference); always
reassign `module.exports` if you want to replace the whole object.

### Importing with `require`

```js
// main.js
const { add, multiply } = require("./math.js");
console.log(add(2, 3));       // 5
console.log(multiply(2, 3));  // 6
```

`require` is a regular, **synchronous** function call. Node reads the file,
executes it top to bottom immediately, caches the resulting
`module.exports` object, and returns it. Because it's synchronous, you can
call `require` anywhere in your code — inside an `if`, inside a function,
conditionally — something ES modules deliberately restrict (see below).

### How Node resolves module paths

- `require("./math.js")` or `require("./math")` — relative paths must
  start with `./` or `../`. Node will also try appending `.js`, `.json`,
  and `.node`, and will look for an `index.js` if you `require` a
  directory.
- `require("lodash")` — a **bare specifier** (no `./`) is resolved by
  walking up the directory tree looking for `node_modules/lodash`.
- `require("fs")` — matches a built-in Node module by name; built-ins
  always win over anything in `node_modules` with the same name.

### The module cache

Node caches modules by their resolved absolute file path. The second time
anything `require`s the same file, Node returns the *same* cached exports
object instead of re-running the file — this is why modules are a great
place to keep singleton state (a shared database connection, a
configuration object), and also why mutating an exported object from one
place affects everyone else who imported it.

## 24.4 ES Modules (the language-native system)

ES2015 introduced `import`/`export` as part of the JavaScript language
itself, not a Node-specific convention. ES Modules (ESM) work in both
browsers (`<script type="module">`) and Node.js (with the right file
extension or `package.json` setting — §24.7).

### Named exports

```js
// math.mjs
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const PI = 3.14159;
```

```js
// main.mjs
import { add, multiply, PI } from "./math.mjs";
console.log(add(2, 3), multiply(2, 3), PI);
```

You can also export a whole block at once, and rename on either side:

```js
function subtract(a, b) { return a - b; }
function divide(a, b) { return a / b; }
export { subtract, divide as safeDivide };

// elsewhere
import { subtract, safeDivide as divide } from "./math.mjs";
```

### Default exports

Each module may additionally have **one** default export — used for "the
main thing this file provides":

```js
// Logger.mjs
export default class Logger {
  log(message) {
    console.log(`[LOG] ${message}`);
  }
}
```

```js
// main.mjs
import Logger from "./Logger.mjs"; // no curly braces, any name you want
const logger = new Logger();
logger.log("hello");
```

You can mix default and named exports in one file, and import both:

```js
import Logger, { LOG_LEVELS } from "./Logger.mjs";
```

### `import.meta`

Inside an ES module, `import.meta` gives you metadata about the current
module — most commonly `import.meta.url`, the file's own URL (useful for
resolving paths relative to the current file, replacing the CommonJS-only
`__dirname`/`__filename`, which do not exist in ESM).

```js
console.log(import.meta.url);
// file:///home/you/project/main.mjs   (Node)
// https://example.com/js/main.mjs     (browser)
```

## 24.5 CommonJS vs. ES Modules: the real differences

These two systems look similar on the surface (`require`/`module.exports`
vs `import`/`export`) but differ in ways that matter in practice:

| | CommonJS | ES Modules |
|---|---|---|
| Loading | Synchronous | Asynchronous (even locally) |
| When resolved | At `require()` call time (runtime) | Statically, before code runs |
| Where allowed | Anywhere (inside `if`, functions, loops) | Only at the top level of a module |
| `this` at top level | `module.exports` | `undefined` |
| Strict mode | Opt-in | Always on |
| Circular imports | Returns partially-completed `exports` | Live bindings that update as the cycle resolves |
| File extension (Node) | `.js` (default) or `.cjs` | `.mjs`, or `.js` with `"type": "module"` |

The **static** nature of ES module imports is a deliberate design choice:
because `import` statements must appear at the top level with a literal
string path (`import x from "./y.js"`, never `import x from someVariable`),
tools can analyze your dependency graph *without running your code*. This
is what enables **tree-shaking** — bundlers like esbuild, Rollup, and
webpack can detect that you only used `add` from `math.mjs` and strip out
`multiply` from the final bundle entirely, something that's much harder to
do safely with CommonJS's dynamic, runtime `require()` calls.

### Interop gotchas

Mixing the two systems is one of the most common sources of confusion in
real projects:

- A CommonJS module can be loaded from an ES module using `import`, but
  Node has to guess how to expose it — typically the entire
  `module.exports` object becomes the **default** export, and named
  imports only work if Node's interop layer can statically detect
  named properties (it usually can for simple objects, but not always).
- An ES module **cannot** be loaded with `require()` at all in standard
  Node.js — attempting `require("./esm-file.mjs")` throws
  `ERR_REQUIRE_ESM`. You must use dynamic `import()` instead (§24.6).
- Many npm packages ship as "dual packages" (both CJS and ESM builds) to
  paper over this — that's what the `exports` field with `require`/
  `import` conditions in a package's `package.json` is for.

## 24.6 Dynamic `import()`

Both CommonJS and ESM code can use the **dynamic import expression**,
`import("./module.js")`, which returns a **Promise** that resolves to the
module's namespace object. Unlike static `import`, it can appear anywhere
— inside a function, inside a conditional — which makes it useful for:

- **Lazy loading** — only download/parse a module when it's actually
  needed (e.g., a heavy chart library, loaded only when the user opens the
  "Reports" tab).
- **Conditional loading** — pick a module based on runtime conditions.
- **Loading ESM from CommonJS.**

```js
async function showReportsTab() {
  const { renderChart } = await import("./chart-library.js");
  renderChart(data);
}

button.addEventListener("click", showReportsTab);
```

## 24.7 Telling Node.js which system you mean

Because a plain `.js` file is ambiguous, Node uses these rules, in order:

1. A file ending in **`.mjs`** is always treated as an ES module.
2. A file ending in **`.cjs`** is always treated as CommonJS.
3. A file ending in plain **`.js`** looks at the nearest `package.json`
   going up the directory tree: if it has `"type": "module"`, the file is
   ESM; otherwise (or if there's no `package.json`) it defaults to CJS.

```json
{
  "name": "my-app",
  "type": "module"
}
```

Setting `"type": "module"` changes the default for **every** `.js` file in
that project, which is why many teams instead just use explicit `.mjs`/
`.cjs` extensions for clarity, especially in mixed codebases.

## 24.8 Modules in the browser

Adding `type="module"` to a `<script>` tag tells the browser to treat that
file (and everything it imports) as an ES module:

```html
<script type="module" src="main.js"></script>
```

This has several implications that differ from regular scripts:

- **Deferred by default** — module scripts don't block HTML parsing and
  always run after the document is parsed, similar to the `defer`
  attribute on regular scripts.
- **Strict mode automatically** — no need for `"use strict"`.
- **Their own scope** — top-level variables in a module script do **not**
  leak onto `window`, unlike classic scripts.
- **CORS rules apply** — a module fetched via `import` from another origin
  needs proper CORS headers, unlike a classic `<script src>`.
- **Only loaded once** — the browser (like Node) caches modules by URL, so
  importing the same module from multiple files only fetches/executes it
  once.

## 24.9 Practical guidance

- For new Node.js projects, prefer ES modules (`"type": "module"`) — it's
  where the language and ecosystem are heading, and it matches browser
  syntax, reducing context-switching.
- For existing large CommonJS codebases, there's rarely a good reason to
  do a risky big-bang migration — dual-package support and dynamic
  `import()` let you interoperate.
- Keep each module focused on one responsibility, and be deliberate about
  what you export — an explicit, small public API per file is the entire
  point of having modules in the first place.

## 24.10 Chapter summary

- Before real modules, JavaScript relied on the global scope and IIFE
  patterns to fake privacy and namespacing.
- **CommonJS** (`require`/`module.exports`) is Node's original, synchronous
  module system, resolved at runtime, loadable from anywhere in your code.
- **ES Modules** (`import`/`export`) are the language-native, statically
  analyzed system that enables tree-shaking, run in both browsers and
  Node, and are always strict-mode.
- The two systems differ in timing (sync vs. async), where imports are
  allowed (anywhere vs. top-level only), and how `this` behaves at the top
  level.
- Dynamic `import()` returns a promise and works in both systems — useful
  for lazy loading and for loading ESM from CommonJS.
- Node decides CJS vs. ESM per file using `.mjs`/`.cjs` extensions or the
  `"type"` field in the nearest `package.json`.

## 24.11 Exercises

1. Run both example subfolders (`examples/24-modules/cjs` and
   `examples/24-modules/esm`) with `node` and confirm they produce the
   same output despite using different module systems.
2. Try changing `module.exports = { add, multiply }` in the CJS example to
   `exports = { add, multiply }` (reassigning `exports` instead of
   `module.exports`). Predict what happens in `main.js`, then run it to
   check.
3. In the ESM example, add a `console.log(import.meta.url)` to `math.mjs`
   and explain what it prints and why it differs from Node's old
   `__filename`.
