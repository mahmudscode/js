# Chapter 30 — Node.js Fundamentals

## 30.1 What Node.js actually is

Node.js is not a language, a framework, or a browser — it is a **runtime**:
a program that lets you execute JavaScript outside of a web browser. Node
was created in 2009 by Ryan Dahl, who took Google's V8 engine (the same
engine that powers Chrome) and embedded it inside a C++ program that adds
capabilities V8 alone doesn't have: reading files, opening network sockets,
spawning processes, and so on.

Node.js is built from three main pieces:

- **V8** — parses and executes your JavaScript, exactly as covered in
  Chapter 1.
- **libuv** — a C library that provides the event loop, asynchronous I/O,
  and a thread pool for operations that can't be done non-blockingly at the
  OS level (like some file system calls and DNS lookups).
- **Node APIs** — a set of built-in modules written partly in C++ and
  partly in JavaScript that expose libuv's capabilities to your code:
  `fs`, `http`, `path`, `os`, `events`, `crypto`, `stream`, and dozens more.

This is the same "engine + host environment" split from Chapter 1, just
with Node.js as the host instead of a browser.

```
┌───────────────────────────────────────────────┐
│                    Node.js                     │
│  ┌───────────┐   ┌────────────────────────┐    │
│  │  V8 Engine │   │   libuv (event loop,    │    │
│  │  (runs JS) │◄──┤   async I/O, thread     │    │
│  └───────────┘   │   pool, timers)          │    │
│                   └────────────────────────┘    │
│  Node APIs: fs, http, path, os, events, crypto,  │
│  net, stream, child_process, buffer, url ...     │
└───────────────────────────────────────────────┘
```

## 30.2 The global object: `globalThis`, and what's missing

In a browser, the global object is `window`. In Node.js, the global object
is `global` (both are also accessible through the universal `globalThis`,
standardized in ES2020 specifically so code can refer to "the global
object" without caring which environment it's in).

```js
console.log(globalThis === global); // true, in Node.js
```

Node.js does **not** have `window`, `document`, or any DOM API — there is
no web page to represent. Instead it exposes server-oriented globals that
browsers don't have:

| Global | Purpose |
|---|---|
| `process` | Information about and control over the current Node.js process |
| `__dirname` / `__filename` | Absolute path of the current file/folder (CommonJS only) |
| `Buffer` | Working with raw binary data |
| `require` / `module.exports` | CommonJS module system (see Chapter 24) |
| `setTimeout`, `setInterval`, `console` | Present in both Node.js and browsers |

## 30.3 `process`: talking to the operating system

`process` is a global object that represents the currently running Node.js
program. It's one of the first things you reach for in any real script.

```js
console.log(process.platform); // "linux", "darwin", "win32", ...
console.log(process.version);  // "v20.11.0"
console.log(process.pid);      // the OS process ID

// Command-line arguments — argv[0] is the node binary, argv[1] is the
// script path, and everything after that is what the user typed.
console.log(process.argv);
// $ node script.js hello world
// [ '/usr/bin/node', '/path/to/script.js', 'hello', 'world' ]

// Environment variables
console.log(process.env.HOME);
console.log(process.env.NODE_ENV ?? "development");

// Exiting with a status code (0 = success, non-zero = failure).
// Useful in CLI tools and CI scripts.
if (someFatalCondition) {
  console.error("Fatal error, aborting.");
  process.exit(1);
}
```

`process.argv` is how you'll parse command-line arguments for CLI tools
throughout this book (see the Todo app in Chapter 35) — no dependency
needed for simple cases.

## 30.4 The `fs` module: reading and writing files

`fs` (file system) is one of the most-used Node.js built-ins. It has three
flavors of nearly every function:

1. **Synchronous** (`fs.readFileSync`) — blocks the entire process until
   done. Fine for CLI scripts and startup code; avoid in servers.
2. **Callback-based** (`fs.readFile`) — the original Node.js async style
   (see Chapter 21). Non-blocking, but leads to callback nesting.
3. **Promise-based** (`fs/promises`) — modern, works beautifully with
   `async`/`await` (see Chapter 23). Prefer this for new code.

```js
import { readFileSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

// Synchronous — simple, but blocks the thread.
writeFileSync("notes.txt", "Hello from Node.js!\n");
const contents = readFileSync("notes.txt", "utf8");
console.log(contents);

// Promise-based — non-blocking, composes with async/await.
async function main() {
  await writeFile("notes-async.txt", "Written asynchronously.\n");
  const text = await readFile("notes-async.txt", "utf8");
  console.log(text);
}
main();
```

A subtle but important detail: without the `"utf8"` encoding argument,
`readFileSync`/`readFile` return a raw `Buffer` (binary data), not a
string. Always pass an encoding when you expect text.

## 30.5 The `path` module: cross-platform file paths

Never build file paths with string concatenation (`dir + "/" + file`) —
Windows uses `\` as a separator, macOS/Linux use `/`, and hand-rolled path
logic breaks the moment your code runs somewhere else. The `path` module
handles this correctly:

```js
import path from "node:path";

path.join("data", "users", "42.json");
// "data/users/42.json" (or "data\\users\\42.json" on Windows)

path.resolve("data", "users", "42.json");
// absolute path from the current working directory

path.basename("/home/user/report.pdf"); // "report.pdf"
path.extname("/home/user/report.pdf");  // ".pdf"
path.dirname("/home/user/report.pdf");  // "/home/user"
```

## 30.6 Building a minimal HTTP server

Frameworks like Express are built on top of Node's core `http` module. It's
worth seeing the low-level version once so the framework doesn't feel like
magic:

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello from a raw Node.js server!\n");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  }
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Every incoming request runs your callback once, with a `req` (request,
readable) and `res` (response, writable) object. There's no routing, no
JSON body parsing, no middleware — that's exactly the gap that frameworks
like Express fill.

## 30.7 The `events` module: `EventEmitter`

`EventEmitter` is the class that powers Node's asynchronous APIs internally
(HTTP servers, streams, file watchers) and is directly usable in your own
code. It implements the **observer pattern** (formalized in Chapter 33):
objects can emit named events, and any number of listeners can subscribe to
react to them.

```js
import { EventEmitter } from "node:events";

class OrderSystem extends EventEmitter {
  placeOrder(item) {
    console.log(`Order placed: ${item}`);
    this.emit("order:placed", { item, timestamp: Date.now() });
  }
}

const orders = new OrderSystem();

orders.on("order:placed", (order) => {
  console.log(`[email] Sending confirmation for ${order.item}`);
});

orders.on("order:placed", (order) => {
  console.log(`[inventory] Decrementing stock for ${order.item}`);
});

orders.placeOrder("Wireless Mouse");
// Order placed: Wireless Mouse
// [email] Sending confirmation for Wireless Mouse
// [inventory] Decrementing stock for Wireless Mouse
```

Both listeners fire synchronously, in the order they were registered, every
time `emit` is called. This decoupling — the order system doesn't know or
care who's listening — is the same principle behind DOM events
(Chapter 28) and is one of the most reusable patterns in JavaScript.

## 30.8 Modules recap

Chapter 24 covers the module system (`import`/`export` vs. `require`/
`module.exports`) in depth. The short version for Node.js specifically: a
project is treated as ECMAScript Modules (ESM, the `import` syntax) if its
`package.json` has `"type": "module"`, or CommonJS (`require`) otherwise.
File extensions can also force the choice: `.mjs` is always ESM, `.cjs` is
always CommonJS regardless of `package.json`.

## 30.9 Release lines and LTS

Node.js ships a new major version roughly every six months. Even-numbered
majors (18, 20, 22, 24...) become **Long-Term Support (LTS)** releases a
few months after launch and are then supported (with security and critical
bug fixes) for about 30 months. Odd-numbered majors are "Current" releases
meant for experimenting with the newest features, not production. **Rule of
thumb: for production services, run the active LTS version.** Tools like
`nvm` (Node Version Manager) let you install and switch between multiple
Node.js versions on one machine, which matters because different projects
on your disk may target different LTS lines.

## 30.10 Chapter summary

- Node.js pairs the V8 JavaScript engine with libuv (the event loop and
  async I/O) and a library of built-in APIs (`fs`, `http`, `path`, `os`,
  `events`, and more) — together, the "Node runtime."
- Node has its own globals (`process`, `Buffer`, `__dirname`) and lacks
  browser-only globals (`window`, `document`).
- `fs` and `fs/promises` read and write files; prefer the promise-based API
  for anything beyond quick scripts.
- `path` builds file paths safely across operating systems.
- The core `http` module can create a working server with no dependencies;
  frameworks like Express add routing and convenience on top of it.
- `EventEmitter` is the built-in implementation of the observer pattern and
  underlies much of Node's own asynchronous API surface.
- Use the active LTS release for production work.

## 30.11 Exercises

1. Write a script that reads its own source file (`__filename` or
   `import.meta.url`) and prints how many lines it contains.
2. Extend the minimal HTTP server to respond with JSON (`Content-Type:
   application/json`) at a `/time` route that returns the current server
   time.
3. Create an `EventEmitter` subclass that models a `TrafficLight` emitting
   `"red"`, `"yellow"`, and `"green"` events, with at least two independent
   listeners reacting differently to each color.
