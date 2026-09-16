# Chapter 1 — Introduction to JavaScript

## 1.1 What is JavaScript?

JavaScript (JS) is a high-level, interpreted (or just-in-time compiled),
dynamically-typed programming language. It was created in 1995 by Brendan
Eich in just ten days while he was working at Netscape, and it has since
become the only programming language that runs natively in every web
browser on Earth. What started as a small scripting language for adding
interactivity to web pages ("make the button blink") has grown into one of
the most widely used programming languages in the world, powering:

- **Front-end web development** — every interactive website you use (React,
  Vue, Angular, Svelte, or plain vanilla JS)
- **Back-end development** — via Node.js, JS powers APIs, servers, and
  microservices (Express, Fastify, NestJS)
- **Mobile apps** — React Native, Ionic, NativeScript
- **Desktop apps** — Electron (VS Code, Slack, Discord are all Electron apps)
- **Games** — Phaser, Three.js, Babylon.js
- **Machine learning** — TensorFlow.js
- **Embedded / IoT** — Johnny-Five, Espruino
- **Command-line tools** — npm itself is written in JS

The single most important fact to internalize about JavaScript is this:
**it is the only language that runs natively in web browsers**. You can
compile other languages *to* JavaScript (TypeScript, ClojureScript,
WebAssembly-adjacent tooling), but the browser itself only understands
HTML, CSS, and JavaScript.

## 1.2 JavaScript vs. Java

Despite the name, JavaScript has almost nothing to do with Java. The name
was a marketing decision made by Netscape in 1995 to ride the popularity of
Java at the time. JavaScript's actual design was inspired by Scheme
(functions as first-class values), Self (prototype-based objects), and a
C-like syntax borrowed from Java to look familiar to programmers.

| | JavaScript | Java |
|---|---|---|
| Typing | Dynamic | Static |
| Execution | Interpreted / JIT-compiled | Compiled to bytecode, run on JVM |
| Object model | Prototype-based | Class-based |
| Primary environment | Browser, Node.js | JVM |
| Concurrency model | Single-threaded, event loop | Multi-threaded |

## 1.3 ECMAScript: the specification behind the language

JavaScript is an *implementation* of a specification called **ECMAScript**
(ES), maintained by Ecma International's TC39 committee. Different
JavaScript engines (V8 in Chrome and Node.js, SpiderMonkey in Firefox,
JavaScriptCore in Safari) all implement the ECMAScript specification, plus
some engine-specific extras.

Major milestones you'll hear referenced constantly:

- **ES5** (2009) — `strict mode`, `Array.prototype.map/filter/reduce`,
  `JSON` object, `Object.create`
- **ES6 / ES2015** — the biggest single update ever: `let`/`const`,
  arrow functions, classes, template literals, destructuring, promises,
  modules, generators, default/rest parameters
- **ES2016 and onward (yearly releases)** — `Array.prototype.includes`,
  `async`/`await` (ES2017), object spread (ES2018), `Array.flat`/`flatMap`
  (ES2019), optional chaining `?.` and nullish coalescing `??` (ES2020),
  `Array.at`, top-level `await` (ES2022), array grouping and more (ES2023+)

TC39 now ships a new version every year, so "ES6" and "modern JavaScript"
are often used loosely to mean "anything from ES2015 onward." This book
teaches modern JavaScript throughout and calls out which version introduced
a feature when it matters.

## 1.4 How JavaScript runs: engines, runtimes, and hosts

A common point of confusion: **JavaScript the language** is separate from
**the environment that runs it**.

- **Engine** — the program that parses and executes JS code (e.g., V8,
  SpiderMonkey). The engine implements ECMAScript: variables, functions,
  objects, the event loop's microtask queue, etc.
- **Runtime / Host environment** — the engine embedded inside a larger
  program that adds extra capabilities the language itself doesn't define:
  - **Browsers** add the DOM, `window`, `fetch`, `localStorage`, timers
  - **Node.js** adds the file system (`fs`), `process`, modules, `Buffer`

This is why `document.querySelector` works in a browser console but throws
`ReferenceError: document is not defined` in Node.js — `document` isn't
part of JavaScript at all; it's a browser API.

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│           Browser           │      │            Node.js          │
│  ┌───────────────────────┐  │      │  ┌───────────────────────┐  │
│  │      V8 Engine         │  │      │  │      V8 Engine         │  │
│  │  (ECMAScript features) │  │      │  │  (ECMAScript features) │  │
│  └───────────────────────┘  │      │  └───────────────────────┘  │
│  + DOM, window, fetch,      │      │  + fs, process, Buffer,     │
│    localStorage, setTimeout │      │    modules, setTimeout      │
└─────────────────────────────┘      └─────────────────────────────┘
```

## 1.5 Compiled vs. interpreted: how V8 actually works

Modern engines like V8 are not purely "interpreted" in the old sense. V8
uses a pipeline:

1. **Parsing** — source code becomes an Abstract Syntax Tree (AST).
2. **Ignition (interpreter)** — generates and runs bytecode quickly, with
   low startup cost.
3. **TurboFan (optimizing JIT compiler)** — profiles hot code paths (code
   that runs many times) and compiles them down to highly optimized machine
   code on the fly.
4. **Deoptimization** — if an assumption TurboFan made turns out to be
   wrong (e.g., a variable that was always a number becomes a string), V8
   "bails out" back to the interpreter and re-optimizes later.

You don't need to memorize this pipeline, but understanding that engines
*optimize based on observed behavior* explains real performance advice
you'll see later in this book — e.g., "don't change an object's shape
after creation" and "keep function argument types consistent."

## 1.6 Single-threaded, event-driven, non-blocking

JavaScript runs on a **single thread** — one line of code executes at a
time, top to bottom, and nothing runs in parallel *within your JS code*.
Yet JavaScript is famous for handling thousands of concurrent network
requests without blocking. The trick is the **event loop**, which we cover
in depth in Chapter 21. For now, the mental model is:

- Your code runs synchronously, one call stack frame at a time.
- Slow operations (network requests, file reads, timers) are handed off to
  the runtime (browser APIs or Node's libuv thread pool), which notifies
  JavaScript via a callback/queue once the work is done.
- JavaScript never blocks waiting for that work — it moves on to the next
  line, and the callback runs later when the engine is free.

This "don't block, get notified later" pattern is why asynchronous
programming (callbacks → promises → async/await) is such a central topic in
JavaScript, more so than in many other mainstream languages.

## 1.7 Dynamic and weakly typed

JavaScript variables don't have a fixed type — the *value* has a type, not
the variable box that holds it:

```js
let x = 42;        // x holds a number
x = "hello";        // now x holds a string — perfectly legal
x = [1, 2, 3];       // now x holds an array
```

JavaScript is also **weakly typed** (or "loosely typed"): it will
automatically convert types for you in many operations, which is a
frequent source of bugs for newcomers:

```js
"5" + 3      // "53"  (number coerced to string, then concatenated)
"5" - 3      // 2     (string coerced to number, then subtracted)
"5" * "2"    // 10    (both coerced to number)
1 + true     // 2     (true coerced to 1)
0 == "0"     // true  (loose equality coerces types)
0 === "0"    // false (strict equality does not coerce)
```

We'll spend real time in Chapter 4 on type coercion rules so these stop
being surprises and start being tools you use deliberately.

## 1.8 Why learn JavaScript deeply?

You can write React apps, Vue apps, or Express servers while treating
JavaScript as a black box you copy-paste patterns into. Many people do.
But every "weird" bug you'll hit — `this` pointing to the wrong object, a
`for` loop closure capturing the wrong variable, an array method silently
returning `undefined`, a promise that never resolves — has a precise,
learnable explanation rooted in how the language actually works. This book
is structured to build that mental model layer by layer: syntax first, then
data structures, then the engine-level concepts (scope, `this`,
prototypes), then asynchronous programming, then the browser and Node.js
platforms, and finally the practices and patterns professional engineers
use to write JavaScript that scales.

## 1.9 Chapter summary

- JavaScript is a dynamic, single-threaded, event-driven language that runs
  natively in every web browser and, via Node.js, on servers.
- ECMAScript is the specification; JavaScript engines (V8, SpiderMonkey,
  JavaScriptCore) are implementations of it.
- "Modern JavaScript" generally means ES2015 (ES6) and later.
- The language itself is separate from its host environment — the DOM
  belongs to browsers, `fs`/`process` belong to Node.js.
- JavaScript is dynamically and weakly typed, which enables flexibility but
  requires understanding coercion rules to avoid bugs.

## 1.10 Exercises

1. Open your browser's DevTools console (F12) and type `typeof window`,
   then open a Node.js REPL (`node`) and type the same thing. What's the
   difference, and why?
2. Predict the output of `"10" - "4" + "2"` and `"10" + "4" - "2"` before
   running them. Then run `examples/01-introduction-to-javascript.js` to
   check your answers.
3. List three things you can build with JavaScript that you didn't know
   before reading this chapter.
