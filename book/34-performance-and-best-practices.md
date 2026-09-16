# Chapter 34 — Performance and Best Practices

## 34.1 Readability is a performance concern too

"Performance" usually means "how fast does this run," but there's a second
kind of performance that determines a codebase's long-term health: how fast
can a human understand and safely change this code? Code that's clever but
opaque costs every future reader (including you, in six months) real time
and real risk of introducing bugs while modifying something they don't
fully understand. Most of the advice in this chapter optimizes for both
kinds of performance at once, because they're rarely in tension — clear
code is usually also easy to make fast, because you can actually see what
it's doing.

## 34.2 Avoid premature optimization

Donald Knuth's famous line — "premature optimization is the root of all
evil" — is frequently misquoted as "never optimize," which isn't the point.
The point is *sequencing*: write clear, correct code first; measure where
the actual bottleneck is (using `console.time`/`console.timeEnd`, a
profiler, or a benchmarking tool); *then* optimize the specific hot path
that measurement identified. Optimizing code that isn't actually a
bottleneck makes it harder to read for zero real-world benefit — the
classic trap is spending an afternoon shaving microseconds off a function
that runs once at startup, while a genuinely slow database query three
files away goes unnoticed.

```js
console.time("expensive operation");
const result = doExpensiveThing();
console.timeEnd("expensive operation"); // "expensive operation: 842.315ms"
```

Measure first. Guessing where code is slow is wrong more often than
intuition suggests, even for experienced engineers.

## 34.3 Common real performance issues

A few patterns show up repeatedly in real, measurable slowdowns:

- **Unnecessary work inside loops (N+1-style problems).** Fetching data
  one item at a time inside a loop — a network request, a database query,
  or even a repeated expensive DOM query — instead of fetching everything
  needed in one batched call before the loop starts. This is the single
  most common source of real-world slowness in web applications, and it
  scales *badly*: a page that's fine with 10 items becomes unusable at
  10,000.

  ```js
  // Slow: one query per user, N+1 total round trips.
  for (const id of userIds) {
    const user = await fetchUser(id);
    results.push(user);
  }

  // Fast: one batched round trip.
  const results = await fetchUsers(userIds);
  ```

- **Unbounded closures and memory leaks.** A closure (Chapter 14) that
  captures a large object and is itself stored somewhere long-lived (a
  global array, an event listener never removed) keeps that object alive
  in memory forever, even after it's logically no longer needed. In
  browsers, a very common leak is an event listener attached to a DOM node
  that never gets removed even after the node is removed from the page —
  the listener's closure keeps the whole node (and anything it closed over)
  alive.

  ```js
  function attachHandler(largeDataset) {
    button.addEventListener("click", () => {
      console.log(largeDataset.length); // keeps largeDataset alive forever
    });
  }
  // If `button` is later removed from the page but the listener was never
  // removed, `largeDataset` still can't be garbage collected.
  ```

  The fix is usually explicit cleanup: `removeEventListener` when a
  component/element is torn down, or using `AbortController` (Chapter 28)
  to remove multiple listeners at once.

- **Unnecessary re-computation.** Re-deriving the same expensive result
  every time it's needed instead of computing it once and reusing it (see
  memoization, section 34.5, and the discussion of UI frameworks
  re-rendering more than necessary when state changes they don't actually
  depend on — a conceptual cousin of this same problem, though the fix in
  that case is usually framework-specific, like React's `useMemo` or
  `React.memo`).

## 34.4 Debouncing and throttling

Both techniques limit how often a function runs in response to
high-frequency events (typing, scrolling, resizing, mouse movement) —
but they solve slightly different problems.

**Debounce**: wait for a pause in activity before running — useful for a
search box that shouldn't fire an API call on every single keystroke, only
once the user stops typing:

```js
function debounce(fn, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

const debouncedSearch = debounce((query) => {
  console.log(`Searching for: ${query}`);
}, 300);

// Rapid calls...
debouncedSearch("h");
debouncedSearch("he");
debouncedSearch("hel");
debouncedSearch("hell");
debouncedSearch("hello");
// ...only the LAST call actually runs, 300ms after the last keystroke.
```

**Throttle**: run at most once per fixed interval, no matter how often the
event fires — useful for a scroll handler that needs to react continuously,
but not on literally every pixel of scroll movement:

```js
function throttle(fn, intervalMs) {
  let isWaiting = false;
  return function (...args) {
    if (isWaiting) return;
    fn.apply(this, args);
    isWaiting = true;
    setTimeout(() => { isWaiting = false; }, intervalMs);
  };
}

const throttledLog = throttle(() => {
  console.log("Scroll position handled");
}, 200);

// Even if this fires 100 times a second, throttledLog's body runs
// at most once every 200ms.
```

The rule of thumb: **debounce** when you only care about the *final* state
after activity settles (search-as-you-type, form validation, window resize
handling); **throttle** when you need *regular* updates throughout
continuous activity (scroll position, drag events, mousemove-driven
effects).

## 34.5 Memoization, revisited

Chapter 19 introduced memoization as a functional-programming technique;
here it is again explicitly as a performance tool. Memoization caches a
pure function's return value by its input, so repeated calls with the same
arguments skip the computation entirely:

```js
function memoize(fn) {
  const cache = new Map();
  return function (n) {
    if (cache.has(n)) return cache.get(n);
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoFibonacci = memoize(function (n) {
  if (n <= 1) return n;
  return memoFibonacci(n - 1) + memoFibonacci(n - 2);
});
```

Naive recursive `fibonacci(40)` re-computes the same sub-results millions
of times (exponential time complexity); the memoized version computes each
unique input exactly once (linear time), trading a small amount of memory
for an enormous amount of repeated work avoided. `examples/34-performance-
and-best-practices.js` benchmarks both versions directly with
`console.time` so you can see the difference in real milliseconds, not just
theory.

Memoization only works correctly for **pure functions** — same input always
produces the same output, with no dependency on external mutable state.
Memoizing a function that depends on the current time, random numbers, or
external state that can change between calls will silently return stale,
wrong results.

## 34.6 `const` by default, and avoiding globals

Two small habits with outsized benefit to both readability and correctness
(both covered in depth in Chapter 3 and Chapter 14, restated here as
performance-adjacent style rules):

- **Default to `const`; use `let` only when a binding genuinely needs
  reassignment; avoid `var` entirely in new code.** A `const` binding tells
  every future reader "this never changes" without them having to trace
  the code to verify it — that's a real cognitive performance win, and it
  also lets the engine make certain assumptions during optimization.
- **Avoid global variables.** Every global is a piece of shared mutable
  state any part of the program (including third-party code and browser
  extensions, in a browser context) can read or overwrite unexpectedly,
  making bugs dependent on *execution order* rather than local reasoning.
  Prefer module-scoped state (Chapter 24) or function parameters/closures
  over attaching data to `window`/`global`.

## 34.7 Linting and formatting tools

Style consistency stops being a matter of taste once a codebase has more
than one contributor — tools automate it so nobody has to argue about it in
code review:

- **ESLint** — analyzes your code for both style issues and *actual bugs*
  (unused variables, unreachable code, missing `await`, accidental
  `==` instead of `===`) via configurable rules.
- **Prettier** — an opinionated code *formatter* (indentation, quote style,
  line length) that removes formatting from human judgment entirely — you
  save a file, it's reformatted, the debate is over.

Most professional JavaScript projects run both: Prettier for formatting,
ESLint for everything formatting can't catch (real bugs and code-quality
rules), often wired into a pre-commit hook or CI check so violations never
reach the main branch.

## 34.8 A JavaScript style checklist

- **Name things by what they represent**, not by their type or how they're
  used (`activeUsers`, not `arr` or `data2`).
- **Keep functions short and focused on one job.** If you struggle to name
  a function without using "and," it's probably doing two things and
  should be two functions.
- **Prefer early returns over deep nesting.**

  ```js
  // Nested — harder to follow the happy path.
  function processOrder(order) {
    if (order) {
      if (order.items.length > 0) {
        if (order.paid) {
          return ship(order);
        }
      }
    }
    return null;
  }

  // Early returns — the happy path reads top to bottom.
  function processOrder(order) {
    if (!order) return null;
    if (order.items.length === 0) return null;
    if (!order.paid) return null;
    return ship(order);
  }
  ```

- **Avoid deep nesting generally** (more than 2-3 levels of indentation is
  a signal to extract a helper function).
- **Don't mutate function parameters** unless that's the function's
  explicit, documented purpose — surprise mutation is a classic source of
  action-at-a-distance bugs.
- **Handle errors where you have enough context to do something useful**
  with them (see Chapter 18) — don't swallow errors silently, and don't
  catch errors you have no meaningful response to just to make a warning
  disappear.

## 34.9 Chapter summary

- Readable code is a performance win for the humans maintaining it, not
  just a nicety.
- Measure before optimizing; don't guess where the bottleneck is.
- The most common real-world slowdowns are unbatched work inside loops and
  memory leaks from un-cleaned-up closures/listeners.
- Debounce waits for a pause before acting (search boxes); throttle limits
  action to a fixed rate during continuous activity (scroll handlers).
- Memoization trades memory for skipped recomputation, but only works
  correctly for pure functions.
- Default to `const`, avoid `var`, and minimize global state.
- ESLint (bugs and style rules) and Prettier (formatting) are standard
  tooling in professional JavaScript codebases.

## 34.10 Exercises

1. Run `examples/34-performance-and-best-practices.js` and compare the
   `console.time` output for naive vs. memoized `fibonacci(35)`. Try
   `fibonacci(40)` naively and predict what happens to the timing before
   running it (consider stopping it if it takes too long — that's the
   point).
2. Take the deeply nested `processOrder` example and identify one more
   real function (from a personal project, or one you've seen) that could
   be flattened using early returns.
3. Implement a `throttle`-based scroll position logger and a
   `debounce`-based search handler in the same file, and describe in one
   sentence each why the *other* technique would be the wrong choice for
   that use case.
