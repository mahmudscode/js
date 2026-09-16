# Chapter 35 — Building Real Projects

Every previous chapter taught one concept in isolation. Real software
requires combining dozens of them into something that actually works end to
end. This chapter builds two complete, working projects from scratch,
narrating the design decisions along the way — not just the final code, but
*why* it ended up looking that way. Both projects deliberately avoid any
external dependency, so everything here runs with the Node.js and browser
built-ins you already have.

## 35.1 Project 1: a command-line Todo app

### 35.1.1 What we're building

A CLI tool, run with `node todo.js <command> [args]`, that:

- `add "<text>"` — adds a new todo item
- `list` — prints all todos, showing completion status
- `complete <id>` — marks a todo as done
- `remove <id>` — deletes a todo
- persists everything to a JSON file on disk, so todos survive between runs

```bash
$ node todo.js add "Buy milk"
Added #1: Buy milk

$ node todo.js add "Write chapter 35"
Added #2: Write chapter 35

$ node todo.js list
  [ ] #1  Buy milk
  [ ] #2  Write chapter 35

$ node todo.js complete 1
Completed #1: Buy milk

$ node todo.js list
  [x] #1  Buy milk
  [ ] #2  Write chapter 35

$ node todo.js remove 2
Removed #2: Write chapter 35
```

### 35.1.2 Design decisions

**Storage: a single JSON file, read and rewritten on every command.** A
real production task manager would use a database, but for a small CLI
tool run occasionally by one person, a JSON file is simpler, human-
inspectable, and requires zero setup — exactly the trade-off that matters
for a project this size. This is `fs` (Chapter 30) doing the heavy lifting:
`readFileSync`/`writeFileSync` for the whole file, since a todo list is
small enough that loading it entirely into memory on every run is not a
real performance concern (see Chapter 34: measure before optimizing — for
data this small, there is nothing to measure).

**Argument parsing: `process.argv`, by hand, no dependency.** Real-world
CLI tools often use a library (`commander`, `yargs`) for argument parsing
with flags, help text, and validation. For four commands and simple
positional arguments, hand-rolling it keeps the example dependency-free and
makes the entire mechanism visible rather than hidden behind a library API
you'd have to look up.

**IDs: a simple incrementing counter, computed from the current max ID.**
No UUID library needed — the todos array itself is the source of truth for
"what's the next available ID."

**Structure: one file, organized top-to-bottom as data layer → command
handlers → dispatcher.** A larger CLI tool would split these into separate
modules (Chapter 24), but at this size, splitting would add navigation
overhead (jumping between files) without adding clarity.

### 35.1.3 Walking through the code

The full, runnable source is in
`examples/projects/cli-todo/todo.js`. The key pieces:

**Reading and writing the data file**, defaulting to an empty list if the
file doesn't exist yet (first run):

```js
function loadTodos() {
  if (!existsSync(DATA_FILE)) return [];
  const raw = readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function saveTodos(todos) {
  writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf8");
}
```

`JSON.stringify(todos, null, 2)` (Chapter 25) pretty-prints the file with
2-space indentation — a small touch that makes the data file readable if
you ever open it directly, at essentially no cost.

**Command handlers**, each a small pure-ish function taking the current
todos array and the relevant arguments, returning the updated array:

```js
function addTodo(todos, text) {
  const nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const todo = { id: nextId, text, done: false };
  console.log(`Added #${todo.id}: ${todo.text}`);
  return [...todos, todo];
}

function completeTodo(todos, id) {
  const numericId = Number(id);
  const todo = todos.find((t) => t.id === numericId);
  if (!todo) {
    console.log(`No todo with id ${id}`);
    return todos;
  }
  todo.done = true;
  console.log(`Completed #${todo.id}: ${todo.text}`);
  return todos;
}
```

**The dispatcher**, mapping the first CLI argument to a handler — this is
the strategy pattern from Chapter 33, applied to command-line commands
instead of shipping options:

```js
const [, , command, ...args] = process.argv;
let todos = loadTodos();

switch (command) {
  case "add":
    todos = addTodo(todos, args.join(" "));
    break;
  case "list":
    listTodos(todos);
    break;
  case "complete":
    todos = completeTodo(todos, args[0]);
    break;
  case "remove":
    todos = removeTodo(todos, args[0]);
    break;
  default:
    printUsage();
    process.exit(1);
}

saveTodos(todos);
```

Note `list` is the one command that doesn't need to save anything (it only
reads) — but calling `saveTodos` after every command unconditionally is
harmless (it just rewrites the same data) and keeps the dispatcher
uniform, which is a reasonable simplicity/purity trade-off for a project
this size.

### 35.1.4 What you'd add for production use

This CLI intentionally stays minimal. Real-world hardening would include:
input validation (what if `add` is called with no text?), a `--help` flag
with real usage text, colored terminal output, and tests (Chapter 32) for
each command handler — all straightforward extensions of exactly the
functions already shown, not a redesign.

## 35.2 Project 2: an in-browser calculator

### 35.2.1 What we're building

A working four-function calculator (add, subtract, multiply, divide) with a
clickable button grid, a running display, a clear button, and full keyboard
support — a single `index.html` file with embedded CSS and JavaScript, no
build step, no dependencies. Open it directly in a browser.

### 35.2.2 Design decisions

**One HTML file, not a bundled app.** Real front-end projects almost always
use a framework and a build tool (Chapter 27 discusses the DOM these
frameworks sit on top of), but a calculator's entire UI is small enough
that a plain HTML file with a `<style>` and `<script>` tag is the simplest
thing that could possibly work — and it demonstrates the raw DOM APIs from
Chapters 27-28 directly, without a framework's abstractions in the way.

**State: a small plain object, not scattered variables.** Rather than
tracking the calculator's state as several independent top-level variables
(`currentValue`, `previousValue`, `operator`, ...), the example keeps a
single `state` object. This mirrors the "single source of truth" principle
that UI frameworks like React formalize — even without a framework, keeping
all your mutable state in one identifiable place makes the program easier
to reason about, since there's exactly one thing to inspect to answer "what
is this app currently doing."

**Rendering: one `render()` function, called after every state change**,
rather than manually updating the display text in ten different places. Any
time a button handler changes `state`, it calls `render()` once at the end.
This is a small-scale version of the same idea that makes declarative UI
frameworks predictable: describe *what the UI should show given the current
state*, and call that description function every time the state changes,
instead of hand-tracking every individual DOM mutation.

**Keyboard support via a single `keydown` listener on `document`**, mapped
to the same handler functions the buttons call — so there is exactly one
implementation of "what happens when you press equals," reachable from
either a mouse click or an Enter key press (Chapter 28 covers event
delegation and listener design in depth).

### 35.2.3 Walking through the code

The full source is in `examples/projects/calculator/index.html`. The state
and core operation logic:

```js
const state = {
  display: "0",
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
};

function inputDigit(digit) {
  if (state.waitingForSecondOperand) {
    state.display = digit;
    state.waitingForSecondOperand = false;
  } else {
    state.display = state.display === "0" ? digit : state.display + digit;
  }
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(state.display);

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator; // just changing operator, e.g. + then *
    return;
  }

  if (state.firstOperand === null) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = calculate(state.firstOperand, inputValue, state.operator);
    state.display = String(result);
    state.firstOperand = result;
  }

  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
}

function calculate(first, second, operator) {
  switch (operator) {
    case "+": return first + second;
    case "-": return first - second;
    case "×": return first * second;
    case "÷": return second === 0 ? NaN : first / second;
    default: return second;
  }
}
```

This `firstOperand`/`operator`/`waitingForSecondOperand` state machine is
the classic shape of a four-function calculator's logic — every button
press is really just a state transition, and `calculate` (a small, pure
function, easy to unit test per Chapter 32) is the only place arithmetic
actually happens. Notice `÷` explicitly guards division by zero rather than
silently displaying `Infinity`, a small correctness decision that's easy to
skip and easy to regret.

Divide-by-zero and `NaN` results are rendered as `"Error"` in `render()`
rather than raw `NaN`/`Infinity` text, which is a deliberate choice about
what a *user* should see versus what the *program's internal state* is —
worth noticing as a general UI principle: internal state and displayed
state don't have to be the same string.

### 35.2.4 Keyboard support

```js
document.addEventListener("keydown", (event) => {
  if (event.key >= "0" && event.key <= "9") inputDigit(event.key);
  else if (event.key === ".") inputDecimal();
  else if (["+", "-"].includes(event.key)) handleOperator(event.key);
  else if (event.key === "*") handleOperator("×");
  else if (event.key === "/") { event.preventDefault(); handleOperator("÷"); }
  else if (event.key === "Enter" || event.key === "=") handleEquals();
  else if (event.key === "Escape") resetCalculator();
  else if (event.key === "Backspace") backspace();
  else return; // don't re-render on keys we don't handle

  render();
});
```

`event.preventDefault()` on `/` stops the browser's default "quick find"
behavior some browsers bind to that key; returning early (and skipping
`render()`) for unhandled keys avoids unnecessary re-renders — a tiny,
concrete instance of the "don't do unnecessary work" performance principle
from Chapter 34, applied at UI scale rather than algorithmic scale.

### 35.2.5 Trying it

Open `examples/projects/calculator/index.html` directly in any browser (no
server required — it's a static file) and try both clicking buttons and
typing on your keyboard; both paths go through the exact same state-
transition functions.

## 35.3 What these two projects have in common

Despite targeting completely different environments (a terminal vs. a
browser tab), both projects follow the same shape, which is worth
noticing explicitly: **a clear separation between state, the logic that
changes state, and the code that displays state.** The CLI todo app reads
JSON into an array, runs a pure-ish handler function against it, and writes
the result back out. The calculator keeps a state object, runs handler
functions that mutate it in response to input, and calls one `render()`
function to reflect it on screen. This "state in, transformation, state
out, then display" shape scales — it's the same underlying structure behind
Redux, React's `useState`, and most database-backed web applications you'll
build professionally. Small projects are where this habit is cheapest to
build.

## 35.4 Chapter summary

- The CLI todo app demonstrates `fs` for persistence, hand-rolled
  `process.argv` parsing, and the strategy/dispatcher pattern for routing
  commands — all dependency-free.
- The browser calculator demonstrates DOM manipulation, event handling
  (mouse and keyboard, unified through shared handler functions), and a
  single-source-of-truth state object rendered by one `render()` function.
- Both projects separate "state," "logic that changes state," and
  "display of state" into distinct, clearly named pieces — a structure
  that scales far beyond these two small examples.
- Neither project needed a single external dependency; the built-in
  platform (Node.js's `fs`/`process`, the browser's DOM/event APIs) was
  sufficient for the whole thing.

## 35.5 Exercises

1. Extend the CLI todo app with an `edit <id> "<new text>"` command that
   changes a todo's text in place.
2. Add a `priority` field to each todo (`low`/`medium`/`high`, defaulting
   to `medium`) and update `list` to sort by priority.
3. Add a percentage (`%`) button to the calculator that converts the
   current display value to a percentage of the first operand (a common
   real calculator feature), and wire it into both the button grid and the
   keyboard handler.
4. Add a `node --test`-based test file (Chapter 32) for the calculator's
   `calculate` function, covering all four operators and the divide-by-zero
   case, by extracting `calculate` into its own module the HTML file can
   `import`.
