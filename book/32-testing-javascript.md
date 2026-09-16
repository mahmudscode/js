# Chapter 32 — Testing JavaScript

## 32.1 Why automated testing matters

Manual testing — clicking around an app, or running a script and eyeballing
the output — doesn't scale. It's slow, it's easy to forget a case, and it
gives you no protection against *regressions*: a change to file A silently
breaking behavior in file B that nobody thought to re-check. Automated
tests are code that verifies your code, and unlike a human, they run in
milliseconds, every time, exactly the same way, forever. The payoff isn't
just "fewer bugs" — it's the confidence to refactor and change code
quickly, because a broken assumption gets caught in seconds instead of
surfacing as a production incident days later.

## 32.2 The testing pyramid: unit, integration, end-to-end

Tests are commonly grouped by scope:

- **Unit tests** — test one small, isolated piece of code (a single
  function, a single class) with everything around it faked or ignored.
  Fast (milliseconds), numerous, cheap to write, precise about what broke
  when they fail.
- **Integration tests** — test multiple pieces working together (a
  function that reads from a real, temporary database; an API route
  actually calling its real service layer). Slower, fewer of them, catch
  bugs unit tests structurally cannot see (two correct pieces that don't
  fit together correctly).
- **End-to-end (E2E) tests** — test the whole system the way a real user
  would (a browser automation script clicking through a signup flow
  against a running app). Slowest, most realistic, most brittle (a CSS
  change can break a test that has nothing to do with styling), typically
  the fewest in number.

The "pyramid" shape is a common piece of advice: have *many* fast unit
tests, a *moderate* number of integration tests, and a *few* critical-path
E2E tests — because the fast, cheap tests at the bottom catch most bugs for
the least cost, while the slow, expensive tests at the top exist to catch
the specific class of bug ("do these pieces actually work together in a
real environment") that only they can find.

## 32.3 Anatomy of a test: Arrange, Act, Assert

Nearly every good test follows the same three-part shape, often called
**AAA**:

1. **Arrange** — set up the inputs and any necessary state.
2. **Act** — call the code under test.
3. **Assert** — check that the result matches what you expected.

```js
test("adds two positive numbers", () => {
  // Arrange
  const a = 2;
  const b = 3;

  // Act
  const result = add(a, b);

  // Assert
  assert.strictEqual(result, 5);
});
```

A good test name describes *behavior*, not implementation — `"adds two
positive numbers"`, not `"test1"` or `"calls add()"`. When a test fails
months from now, its name alone should tell you what broke.

## 32.4 Test doubles: mocks, stubs, and spies

Unit tests isolate the code under test by replacing its real dependencies
with fake ones, collectively called **test doubles**:

- **Stub** — a fake that returns a canned value, replacing a real
  dependency so the test doesn't depend on it (e.g., a fake
  "getCurrentTime" that always returns a fixed date, so a test doesn't
  become flaky based on when it happens to run).
- **Mock** — like a stub, but the test also asserts *how* it was called
  (was `sendEmail` called exactly once, with this address?). Mocks verify
  interactions, not just outcomes.
- **Spy** — wraps a *real* function, letting it still run normally while
  recording how it was called, so you can assert on the calls afterward
  without changing the function's behavior.

The underlying motivation for all three is the same: a unit test for
function A shouldn't fail because function B (which A happens to call) has
a bug, is slow, costs money to call (a real payment API), or is
non-deterministic (the current time, a random number, the network). Doubles
let you test A's logic in isolation.

## 32.5 Popular frameworks: a conceptual comparison

You'll encounter three names constantly in the JavaScript ecosystem:

| Framework | Notes |
|---|---|
| **Jest** | Created at Facebook; long the default choice for React and general JS projects. Batteries-included: test runner, assertion library, and mocking all in one, zero-config for most projects. |
| **Vitest** | Built for projects using Vite; Jest-compatible API, much faster in Vite-based projects because it reuses Vite's module transformation pipeline instead of its own. |
| **Mocha** | Older, unopinionated test runner — you pick your own assertion library (often paired with `chai`) and mocking library (often `sinon`) separately. Maximum flexibility, more setup. |

All three share the same conceptual vocabulary this chapter teaches
(`describe`/`test` or `it` blocks, `expect`/`assert` style assertions,
`beforeEach`/`afterEach` hooks for setup and teardown) — learning one makes
the others easy to pick up. This book uses Node.js's **built-in** test
runner for hands-on examples specifically so every example in this repo
runs with zero installed dependencies.

## 32.6 Hands-on: Node's built-in test runner

Since Node.js 18, a test runner and assertion library ship with Node.js
itself — no installation required. Import from `node:test` and
`node:assert`:

```js
// sum.js
export function sum(a, b) {
  return a + b;
}
```

```js
// sum.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { sum } from "./sum.js";

test("sum adds two numbers", () => {
  assert.strictEqual(sum(2, 3), 5);
});

test("sum handles negative numbers", () => {
  assert.strictEqual(sum(-1, -1), -2);
});
```

Run it with:

```bash
node --test examples/32-testing-javascript/
```

`node:test` supports the same conceptual building blocks as Jest/Mocha:

```js
import test, { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

describe("a counter", () => {
  let count;

  beforeEach(() => {
    count = 0; // fresh state before every test in this block
  });

  it("starts at zero", () => {
    assert.strictEqual(count, 0);
  });

  it("increments", () => {
    count += 1;
    assert.strictEqual(count, 1);
  });
});
```

`assert/strict` uses strict equality (`===`-like comparisons, and deep
strict equality for objects/arrays) — prefer it over the legacy `assert`
module, whose default comparisons use the loose `==` semantics from
Chapter 4.

## 32.7 A worked example: red, green, refactor

A common workflow, **Test-Driven Development (TDD)**, writes the test
*before* the implementation:

1. **Red** — write a test for behavior that doesn't exist yet; run it, watch
   it fail (there's nothing to pass yet).
2. **Green** — write the simplest possible code that makes the test pass.
3. **Refactor** — clean up the implementation (and/or the test) with the
   safety net of a passing test catching any regression.

```js
// Step 1 (red): write the test first.
test("clamp restricts a value to a range", () => {
  assert.strictEqual(clamp(15, 0, 10), 10);
  assert.strictEqual(clamp(-5, 0, 10), 0);
  assert.strictEqual(clamp(5, 0, 10), 5);
});
// Running this now fails: ReferenceError: clamp is not defined.

// Step 2 (green): the simplest implementation that passes.
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
// Running the test now: all three assertions pass.

// Step 3 (refactor): same behavior, using Math.min/Math.max instead.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
// Re-run the test — still passes, confirming the refactor didn't
// change behavior.
```

TDD isn't mandatory for every line of code you write, but the discipline of
"can I describe the expected behavior as a test before I write the code" is
a genuinely useful design tool even when used selectively.

## 32.8 Code coverage: a signal, not a goal

Coverage tools (like `c8`, which works with `node --test`) report what
percentage of your code's lines/branches were executed while your test
suite ran. High coverage numbers feel reassuring, but coverage measures
*execution*, not *correctness* — a test that calls a function without
asserting anything meaningful about its output "covers" that function while
verifying nothing. Use coverage to find code with **no** tests at all
(a genuinely useful signal), not as a target to game by inflating a
percentage.

## 32.9 Chapter summary

- Automated tests catch regressions fast and give you the confidence to
  refactor.
- Unit, integration, and end-to-end tests trade off speed and cost against
  realism; use many of the fast, cheap ones and fewer of the slow,
  realistic ones.
- Arrange/Act/Assert is the standard shape of an individual test.
- Stubs, mocks, and spies isolate the code under test from its
  dependencies.
- Jest, Vitest, and Mocha are the most common frameworks; Node.js also
  ships a built-in `node:test` + `node:assert` runner requiring zero
  installation.
- TDD (red, green, refactor) is a workflow where tests are written before
  the implementation.
- Code coverage tells you what's *untested*, not what's *correct*.

## 32.10 Exercises

1. Run `node --test examples/32-testing-javascript/` and confirm all tests
   pass, then intentionally break `sum.js` (e.g., change `+` to `-`) and
   re-run to see a failing test's output.
2. Using TDD, write a test first for a `isPalindrome(str)` function, watch
   it fail, then implement the function to make it pass.
3. Identify one place in `examples/30-nodejs-fundamentals.js`'s
   `EventEmitter` example from Chapter 30 where a spy would let you test
   "was the `order:placed` listener called with the right item" without
   relying on `console.log` output.
