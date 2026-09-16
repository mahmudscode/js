# Chapter 2 — Setting Up Your Environment

## 2.1 Two places JavaScript runs, two ways to start

Before writing real programs you need a place to run code and a way to see
its output. This book uses two environments throughout:

1. **The browser** — for anything touching the DOM, events, or the visual
   page (Part V).
2. **Node.js** — for everything else: learning the language itself,
   scripting, servers, tests, and tooling. Every example file in this
   book's `examples/` folder is a plain Node.js script unless the chapter
   says otherwise.

You do not need to choose one over the other permanently — professional
JavaScript developers move between both constantly.

## 2.2 Installing Node.js

Node.js is a JavaScript runtime built on Chrome's V8 engine that lets you
run JavaScript outside a browser. Installing it also installs **npm**
(Node Package Manager), which you'll use starting in Chapter 31.

Recommended installation methods:

- **Official installer** — download the "LTS" (Long-Term Support) build
  from nodejs.org. LTS is more stable than "Current" and is what
  production servers use.
- **Version manager (recommended for developers)** — tools like `nvm`
  (Node Version Manager) let you install and switch between multiple Node
  versions per project:

  ```bash
  # install nvm (one-time), then:
  nvm install --lts
  nvm use --lts
  node --version   # e.g. v20.11.0
  npm --version    # e.g. v10.2.4
  ```

Version managers matter because different projects often pin different
Node versions, and reinstalling Node globally every time you switch
projects is painful. This is enough setup detail for this book — a full
DevOps/tooling guide is out of scope, but know that `nvm` (macOS/Linux) and
`nvm-windows`/`fnm` (Windows) are the standard tools.

Verify your install:

```bash
node --version
npm --version
```

## 2.3 Running a script with Node.js

Create a file `hello.js`:

```js
console.log("Hello, JavaScript!");
```

Run it from your terminal:

```bash
node hello.js
```

That's it — no compilation step, no build tool required for plain scripts.
This is exactly how every example in this book's `examples/` folder is
meant to be run: `node examples/NN-topic.js`.

## 2.4 The Node REPL

Typing `node` with no filename starts the **REPL** (Read-Eval-Print Loop),
an interactive JavaScript shell:

```bash
$ node
> 1 + 1
2
> const greeting = "hi";
undefined
> greeting
'hi'
> .exit
```

The REPL is invaluable for quickly testing a one-liner without creating a
file. Note that it prints `undefined` after statements that don't produce
a value (like `const greeting = "hi"`), which surprises newcomers — that's
normal, not an error.

Browsers have an equivalent: open DevTools (F12, or right-click → Inspect)
and click the **Console** tab. You can type JavaScript directly there and
it has access to the current page's `document`, `window`, and any scripts
already loaded.

## 2.5 Choosing an editor: VS Code

Any text editor can write JavaScript, but **Visual Studio Code (VS Code)**
is the de facto standard for JS/TS development because of its built-in
IntelliSense (autocomplete), integrated terminal, and huge extension
ecosystem. Recommended setup:

- Install VS Code from code.visualstudio.com.
- Extensions worth installing early:
  - **ESLint** — surfaces linting errors inline (see 2.7)
  - **Prettier** — auto-formats code on save
  - **Error Lens** — shows errors/warnings inline instead of only in a
    side panel
- Enable "Format on Save" in settings so you never think about formatting
  manually.

You don't need any of this to follow along with this book — a plain text
editor and terminal are enough — but it will make the exercises faster.

## 2.6 `console` methods beyond `console.log`

`console.log` is the workhorse, but the `console` object has several other
methods that make debugging much more pleasant:

```js
console.log("info message");
console.warn("something looks off");     // yellow in most consoles
console.error("something broke");        // red, includes a stack trace

console.table([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]); // renders an actual table — extremely useful for arrays of objects

console.group("User validation");
console.log("checking name...");
console.log("checking email...");
console.groupEnd(); // indents the grouped logs, then closes the group

console.time("loop");
for (let i = 0; i < 1e6; i++) {} // do some work
console.timeEnd("loop"); // prints "loop: 1.234ms"

console.count("call"); // "call: 1"
console.count("call"); // "call: 2"

console.assert(1 === 2, "1 is not 2"); // only logs when the assertion is false
```

In browser DevTools, `console.error` and `console.trace` also capture a
clickable stack trace pointing to exactly where they were called — one of
the fastest ways to locate a bug's origin.

## 2.7 Linting and formatting (conceptual overview)

As programs grow, two categories of tooling become essential:

- **Linters** (e.g., **ESLint**) analyze your code for *likely bugs* and
  *style violations* without running it — catching things like unused
  variables, unreachable code, or accidentally using `==` instead of
  `===`, before you ever run the program.
- **Formatters** (e.g., **Prettier**) rewrite your code's whitespace,
  quote style, and line breaks to a consistent style automatically, so
  teams stop arguing about tabs vs. spaces in code review.

You don't need to configure either to follow this book, but know that
virtually every professional JavaScript codebase runs both, usually
wired into the editor (format/lint on save) and into CI (fail the build
on lint errors). We revisit ESLint/Prettier configuration briefly in
Chapter 31 alongside `package.json`.

## 2.8 Strict mode

`"use strict"` is a directive that opts your code into a stricter variant
of JavaScript that catches common mistakes by throwing errors instead of
failing silently or creating implicit globals:

```js
"use strict";

x = 10; // ReferenceError: x is not defined
// without strict mode, this silently creates a global variable `x`
```

Key behavior differences under strict mode:

- Assigning to an undeclared variable throws instead of creating a global.
- Assigning to a read-only or non-writable property throws instead of
  failing silently.
- Duplicate parameter names (`function f(a, a) {}`) are a syntax error.
- `this` inside a plain function call is `undefined` instead of the
  global object (important for Chapter 15).

You rarely need to write `"use strict"` yourself in modern code because:

- **ES modules** (`import`/`export`, or `<script type="module">`) are
  **always** strict mode automatically.
- **Class bodies** are always strict mode automatically.

But you will see it at the top of older files and should recognize what it
does when you do.

## 2.9 Including JavaScript in HTML

For browser-based work, JavaScript is attached to an HTML page with a
`<script>` tag:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello</h1>

    <!-- Option A: inline script -->
    <script>
      console.log("inline script ran");
    </script>

    <!-- Option B: external file -->
    <script src="app.js"></script>
  </body>
</html>
```

Where you place `<script>` and which attributes you use changes *when*
your code runs relative to the HTML being parsed — this trips up
beginners constantly, so it's worth being precise:

- **No attribute, placed in `<head>`** — the browser stops parsing HTML,
  downloads and *executes* the script immediately, then resumes parsing.
  If your script tries to access DOM elements that appear later in the
  HTML, they won't exist yet. This is why the old convention was "put
  your `<script>` tag right before `</body>`."
- **`defer`** — the script downloads in parallel with HTML parsing but
  only *executes* after the HTML is fully parsed, and multiple `defer`
  scripts run in the order they appear. This is the modern default for
  a page's main script.
- **`async`** — the script downloads in parallel and executes as soon as
  it's ready, potentially *before* HTML parsing finishes, and with no
  guaranteed order relative to other `async` scripts. Good for
  independent scripts like analytics that don't touch the DOM or depend
  on other scripts.
- **`type="module"`** — marks the script as an ES module (Chapter 24),
  enabling `import`/`export`. Module scripts are deferred by default and
  always run in strict mode.

```html
<script src="app.js" defer></script>
<script src="analytics.js" async></script>
<script type="module" src="main.js"></script>
```

```
Head-blocking script:  [download][execute] ----parsing resumes---->
defer script:          [download in background] ------ [execute after parse]
async script:          [download in background] -- [execute immediately when ready]
```

## 2.10 A minimal project layout

Nothing fancy is required to start. A reasonable folder layout for
following along with this book, or starting any small JS project:

```
my-project/
├── index.html      (only needed for browser work)
├── app.js           (or src/index.js for larger projects)
└── package.json     (introduced in Chapter 31)
```

For every chapter from here on, assume you can create a file, write
JavaScript in it, and run it with `node filename.js` unless the chapter
explicitly says it needs a browser.

## 2.11 Chapter summary

- Node.js runs JavaScript outside the browser; install it via nodejs.org
  or a version manager like `nvm`, and verify with `node --version`.
- `node file.js` runs a script; plain `node` opens an interactive REPL.
- Browser DevTools' **Console** tab is the browser equivalent of the REPL.
- VS Code plus the ESLint and Prettier extensions is the most common
  professional setup, though any editor works for learning.
- `console` has many methods beyond `log`: `warn`, `error`, `table`,
  `group`/`groupEnd`, `time`/`timeEnd`, `count`, `assert`.
- Linters catch likely bugs statically; formatters enforce consistent
  style automatically.
- `"use strict"` catches silent mistakes by throwing errors instead;
  ES modules and classes are strict by default.
- `<script>` placement and the `defer`/`async`/`type="module"` attributes
  control *when* a script executes relative to HTML parsing.

## 2.12 Exercises

1. Install Node.js (or verify it's installed) and run
   `node examples/02-setting-up-environment.js`.
2. Open the Node REPL, and without creating a file, compute the sum of
   the numbers 1 through 10 using a `for` loop typed directly into the
   REPL.
3. Create a two-line HTML file with a `<script defer>` tag that tries to
   read `document.title` and log it — confirm it works even when the
   script tag is placed in `<head>`, then try it again without `defer`
   and see if the behavior changes for this simple example.
