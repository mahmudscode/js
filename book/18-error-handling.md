# Chapter 18 — Error Handling

## 18.1 Why errors need a strategy, not just a reaction

Every non-trivial program encounters situations it cannot proceed through
normally: a file doesn't exist, a network request times out, a user types
`"abc"` into a field expecting a number. JavaScript gives you a structured
way to signal that something went wrong (`throw`) and a structured way to
react to it (`try`/`catch`/`finally`). Learning to use these deliberately —
rather than sprinkling defensive `if` checks everywhere — is what
separates code that fails predictably from code that fails mysteriously in
production at 3 a.m.

## 18.2 `try`, `catch`, and `finally`

```js
try {
  const result = JSON.parse("{ invalid json");
  console.log(result); // never reached
} catch (error) {
  console.log("Parsing failed:", error.message);
} finally {
  console.log("This always runs, error or not.");
}
```

- Code in `try` runs normally until something throws.
- If something throws, execution jumps immediately to `catch`, skipping
  the rest of the `try` block entirely — even code several lines after the
  point of failure never runs.
- `finally` runs **unconditionally** — whether the `try` succeeded, threw
  and was caught, or even if the `catch` block itself re-throws. It's the
  right place for cleanup that must always happen (closing a file handle,
  hiding a loading spinner, releasing a lock).

```js
function readConfig() {
  console.log("opening resource...");
  try {
    throw new Error("disk read failed");
  } finally {
    console.log("closing resource..."); // still runs, even though nothing catches the error here
  }
}
try {
  readConfig();
} catch (e) {
  console.log("caught at outer level:", e.message);
}
// Output order: "opening resource...", "closing resource...", "caught at outer level: disk read failed"
```

### Optional catch binding

If you don't need the error object itself, you can omit the parentheses
entirely (ES2019+):

```js
try {
  riskyOperation();
} catch {
  console.log("Something went wrong, but we don't need the details here.");
}
```

## 18.3 `throw`: you can throw anything, but you shouldn't

JavaScript technically lets you `throw` any value — a string, a number, a
plain object — but you should always throw an `Error` object (or a
subclass of it). `Error` objects automatically capture a **stack trace**
(`error.stack`) showing exactly where the error originated and the call
path that led there — information you permanently lose if you throw a bare
string.

```js
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

try {
  divide(10, 0);
} catch (error) {
  console.log(error.message);          // "Division by zero"
  console.log(error instanceof Error); // true
  console.log(typeof error.stack);     // "string" — a full stack trace
}
```

## 18.4 Custom error types

Subclassing `Error` (using the `class`/`extends` mechanics from Chapter
17) lets you create semantically meaningful error types that calling code
can distinguish between with `instanceof`, instead of parsing error
message strings (which is brittle — messages change, types shouldn't).

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);       // sets this.message, sets up the stack trace
    this.name = "ValidationError"; // overrides the default "Error" name shown in stack traces
    this.field = field;   // custom data specific to this error type
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

function validateAge(age) {
  if (typeof age !== "number" || age < 0) {
    throw new ValidationError("Age must be a non-negative number", "age");
  }
  return age;
}

try {
  validateAge(-5);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed on field "${error.field}": ${error.message}`);
  } else if (error instanceof NotFoundError) {
    console.log("Not found:", error.message);
  } else {
    throw error; // unknown error type: re-throw, don't silently swallow it
  }
}
```

Re-throwing unknown errors in the last `else` branch is an important
habit: a `catch` block that's only prepared to handle specific error types
should let anything else propagate up rather than silently hiding a bug it
doesn't understand.

## 18.5 Error propagation

An uncaught error inside a function doesn't just vanish — it propagates up
through every enclosing function call until something catches it, or, if
nothing does, it crashes the program (in Node.js) or gets logged to the
console (in browsers).

```js
function level3() {
  throw new Error("failure deep in level3");
}
function level2() {
  level3(); // no try/catch here — the error just passes through
}
function level1() {
  level2(); // no try/catch here either
}

try {
  level1();
} catch (error) {
  console.log("Caught at the top:", error.message); // "Caught at the top: failure deep in level3"
}
```

This is a deliberate and useful design: you don't need to handle every
possible error at the exact point it might occur. You can let errors
"bubble up" to a place in your code that actually knows what a sensible
recovery looks like (e.g., a top-level request handler that returns a 500
response) instead of littering every low-level function with try/catch
blocks it can't meaningfully act on.

## 18.6 `try`/`catch` with `async`/`await` (preview)

Chapters 21–23 cover asynchronous JavaScript in depth, but it's worth
previewing here: `try`/`catch` works with `await`ed promises exactly like
it works with synchronous throws, which is one of the biggest ergonomic
wins `async`/`await` brought over raw promise chains.

```js
async function fetchUserSafely(id) {
  try {
    const response = await fetch(`/api/users/${id}`); // hypothetical call
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.log("Failed to fetch user:", error.message);
    return null;
  }
}
```

A rejected promise behaves, inside an `async` function, exactly like a
synchronous `throw` — it's caught by the nearest enclosing `try/catch`.

## 18.7 Defensive programming vs. fail-fast

There are two broad philosophies for handling invalid input or unexpected
state, and good engineers apply both, deliberately, in different places:

- **Fail-fast**: throw immediately when something is wrong, as close to
  the source of the problem as possible. This makes bugs loud and obvious
  during development, rather than letting bad data silently propagate and
  cause a confusing failure somewhere unrelated much later.
- **Defensive/graceful degradation**: catch expected failure modes (a
  network timeout, a missing optional field) and provide a sensible
  fallback so the whole program doesn't crash over something recoverable.

The mistake to avoid is applying defensive catch-and-ignore everywhere,
which hides real bugs:

```js
// BAD: swallows every error, including genuine bugs, silently
function getUserNameBad(user) {
  try {
    return user.profile.name.toUpperCase();
  } catch {
    return "Unknown"; // masks a typo, a null profile, AND a real crash, identically
  }
}

// BETTER: validate explicitly, fail loudly on truly unexpected shapes
function getUserNameBetter(user) {
  if (!user?.profile?.name) {
    return "Unknown"; // an EXPECTED, named condition, not a caught exception
  }
  return user.profile.name.toUpperCase();
}
```

## 18.8 `console.error`/`console.warn` vs. throwing

Not every problem should halt execution. `console.error`/`console.warn`
are for *logging* — surfacing information to a developer without changing
control flow — while `throw` actually interrupts execution and forces the
caller to deal with the problem (or crash). A rough guideline:

- Use `throw` when the function **cannot** produce a valid result and the
  caller must be forced to handle that (or explicitly choose not to).
- Use `console.warn` for something suspicious but recoverable (a
  deprecated option was passed, but the function can still proceed
  sensibly).
- Use `console.error` for logging an error you've already caught and
  handled, when you still want a visible trace for debugging.

## 18.9 Global error handlers (brief)

As a last line of defense, both browsers and Node.js let you catch errors
that escaped every `try/catch` in your code — useful for logging/reporting
tools, not for normal control flow:

```js
// Browser:
window.addEventListener("error", (event) => {
  console.log("Uncaught error:", event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.log("Unhandled promise rejection:", event.reason);
});

// Node.js:
process.on("uncaughtException", (error) => {
  console.log("Uncaught exception:", error.message);
  process.exit(1); // best practice: exit after an uncaught exception, state may be corrupted
});
process.on("unhandledRejection", (reason) => {
  console.log("Unhandled rejection:", reason);
});
```

These are safety nets for logging/monitoring (e.g., reporting to an error
tracking service), not a substitute for handling errors properly at the
point they occur.

## 18.10 Chapter summary

- `try`/`catch`/`finally` structure error handling: `catch` runs on a
  thrown error, `finally` runs unconditionally for cleanup.
- Always `throw new Error(...)` (or a subclass), never a bare string or
  plain object — `Error` objects carry a stack trace.
- Subclass `Error` to create semantically distinct, `instanceof`-checkable
  custom error types instead of parsing message strings.
- Uncaught errors propagate up through the call stack until something
  catches them or the program crashes — this lets you centralize handling
  where it's actually meaningful.
- `try/catch` works identically for `await`ed promise rejections as for
  synchronous throws (previewed here, covered fully in Chapters 21–23).
- Balance fail-fast (throw loudly, close to the bug) against defensive
  fallback (catch genuinely recoverable, expected conditions) — don't
  blanket-swallow every error, which hides real bugs.
- `console.error`/`warn` are for logging; `throw` is for control flow.

## 18.11 Exercises

1. Write a `parseJsonSafely(str)` function that returns the parsed value
   on success, or `null` on failure, without letting a malformed JSON
   string crash the caller.
2. Create a custom `InsufficientFundsError extends Error` and use it in a
   `withdraw(balance, amount)` function; catch it specifically and print a
   friendly message, while letting any other unexpected error propagate.
3. Predict the console output order of a `try` block that logs `"A"`,
   throws, is caught and logs `"B"`, with a `finally` that logs `"C"`.
