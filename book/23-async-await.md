# Chapter 23 — Async/Await

## 23.1 Async/await is syntax sugar over promises

`async`/`await` (ES2017) is not a new concurrency model — it's syntax that
lets you write promise-based code that *looks* synchronous, while the
engine still runs it asynchronously underneath, using the exact same
promises and microtask machinery from Chapter 22. Every `async` function
you write compiles down, conceptually, to a promise chain.

```js
// Promise chain style
function loadUser(id) {
  return fetchUser(id)
    .then((user) => {
      console.log("Got user:", user.name);
      return fetchOrders(user.id);
    })
    .then((orders) => {
      console.log("Got orders:", orders.length);
    });
}

// Equivalent async/await style
async function loadUser(id) {
  const user = await fetchUser(id);
  console.log("Got user:", user.name);
  const orders = await fetchOrders(user.id);
  console.log("Got orders:", orders.length);
}
```

Both versions behave identically at runtime — same event loop, same
microtask scheduling, same eventual output order. `async`/`await` just
removes the visual nesting and the `.then` boilerplate, making asynchronous
logic read top-to-bottom like ordinary code.

## 23.2 The `async` keyword: functions that always return a promise

Placing `async` before a function declaration changes two things:

1. You may use `await` inside the function body.
2. The function **always returns a promise**, no matter what you `return`
   inside it.

```js
async function getAnswer() {
  return 42;
}

getAnswer().then((value) => console.log(value)); // 42
console.log(getAnswer()); // Promise { 42 } — NOT the number 42 directly
```

If the function body explicitly `return`s a value, that value becomes the
resolved value of the returned promise. If the function body `throw`s, the
returned promise rejects with that thrown value. If the function returns
another promise, the outer promise adopts its state (fulfills or rejects
to match).

`async` works on function declarations, function expressions, arrow
functions, object methods, and class methods:

```js
const asyncArrow = async () => "arrow result";
const obj = { async method() { return "method result"; } };
class Service { async fetchData() { return "class method result"; } }
```

## 23.3 The `await` keyword: pausing for a promise

`await` can only be used inside an `async` function (with one exception —
top-level await, see 23.7). It takes a promise, **pauses the async
function's execution** at that point (without blocking the rest of the
program — other code keeps running), and resumes the function once the
promise settles.

- If the promise **fulfills**, `await` evaluates to the resolved value.
- If the promise **rejects**, `await` **throws** that rejection reason as
  a regular JavaScript exception, at the point of the `await`.

```js
async function loadProfile() {
  const user = await fetchUser(1); // pauses here until fetchUser resolves
  console.log("User loaded:", user.name); // resumes here, with the value
}
```

Crucially, "pauses" only pauses that specific `async` function's own
execution — it does not block the call stack or the rest of your program.
Other synchronous code, other timers, and other async functions continue
running normally while one `async` function is waiting at an `await`.

## 23.4 Error handling with try/catch

Because a rejected `await` throws, you handle async errors with ordinary
`try`/`catch` — no more `.catch()` chains required:

```js
async function loadProfileSafely() {
  try {
    const user = await fetchUser(-1); // this will reject
    console.log("User:", user.name);
  } catch (err) {
    console.error("Failed to load profile:", err.message);
  } finally {
    console.log("Done attempting to load profile");
  }
}
```

A single `try` block can wrap multiple `await` calls, and one `catch` will
handle a failure from any of them — this mirrors how a single `.catch` at
the end of a promise chain catches failures from any earlier `.then`.

```js
async function checkout(cartId) {
  try {
    const cart = await fetchCart(cartId);
    const priced = await priceCart(cart);
    const receipt = await charge(priced);
    return receipt;
  } catch (err) {
    // catches a failure from fetchCart, priceCart, OR charge
    console.error("Checkout failed:", err.message);
    throw err; // re-throw if the caller also needs to know
  }
}
```

## 23.5 Sequential vs. parallel awaits — the classic mistake

`await` pauses *that line*, which means multiple `await`s written one
after another run **sequentially**, even when the operations don't depend
on each other at all:

```js
// SLOW: sequential — each fetch waits for the previous one to finish,
// even though they're completely independent of each other
async function loadDashboardSlow() {
  const user = await fetchUser(1);       // waits ~200ms
  const orders = await fetchOrders(1);   // THEN waits another ~150ms
  const invoices = await fetchInvoices(1); // THEN waits another ~180ms
  return { user, orders, invoices }; // total: ~530ms
}
```

If the three fetches don't depend on each other, start them all at once
and await the combined result with `Promise.all`:

```js
// FAST: parallel — all three requests start at the same time
async function loadDashboardFast() {
  const [user, orders, invoices] = await Promise.all([
    fetchUser(1),
    fetchOrders(1),
    fetchInvoices(1),
  ]);
  return { user, orders, invoices }; // total: ~200ms (the slowest one)
}
```

The rule of thumb: **only `await` sequentially when each step genuinely
needs the previous step's result.** Otherwise, start the independent
promises first (without `await`), then await them together.

### The loop mistake: `await` inside `for`, one item at a time

```js
// SLOW: processes ids strictly one at a time
async function fetchAllSlow(ids) {
  const results = [];
  for (const id of ids) {
    const user = await fetchUser(id); // blocks the loop until this finishes
    results.push(user);
  }
  return results;
}

// FAST: fires all requests immediately, waits for all together
async function fetchAllFast(ids) {
  const promises = ids.map((id) => fetchUser(id)); // no await here yet —
  return Promise.all(promises);                     // starts them all at once
}
```

`ids.map((id) => fetchUser(id))` calls `fetchUser` for every id
**synchronously and immediately** (each call starts its own async work in
the background and returns a promise instantly), building an array of
in-flight promises before a single `await` happens. `Promise.all` then
waits for all of them concurrently. This is one of the most impactful
performance fixes you can make in real-world async code — sequential
awaits in a loop are a frequent, easy-to-miss source of slow APIs.

Note: if the operations must run one-at-a-time on purpose (e.g., to avoid
overwhelming a rate-limited API, or because each step depends on shared
mutable state), the sequential `for` loop with `await` is the *correct*
choice — the goal isn't "always parallelize," it's "parallelize
independent work."

## 23.6 Async functions always return promises — chaining and mixing

Since an `async` function returns a promise, you can call it and continue
with `.then`, or `await` it from inside another `async` function:

```js
async function getTotal() {
  return 100;
}

// Both are valid:
getTotal().then((total) => console.log("via .then:", total));

async function useIt() {
  const total = await getTotal(); // via await
  console.log("via await:", total);
}
```

You'll sometimes see `.then` and `await` mixed together in the same
codebase, but doing so **within a single function** tends to hurt
readability — pick one style per function and stay consistent. A common,
justified exception is fire-and-forget: calling an `async` function and
attaching only a `.catch` when you deliberately don't want to wait for it:

```js
function logAnalyticsEvent(name) {
  sendAnalytics(name).catch((err) => {
    console.error("Analytics failed (non-critical):", err.message);
  });
  // deliberately NOT awaited — don't make the user wait on analytics
}
```

## 23.7 Top-level await

Historically, `await` was only legal inside an `async` function. ES2022
introduced **top-level await**, which allows `await` directly in the top
level of an ES module (`.mjs` files, or `.js` files in a package with
`"type": "module"` in `package.json`) — no wrapping `async function`
needed.

```js
// top-level in an ES module
const config = await loadConfig();
console.log("Config ready:", config);
```

Top-level await is extremely convenient for scripts and module
initialization (e.g., a module that needs to fetch configuration before
exporting anything), but it's only available in modules, not in regular
CommonJS scripts (`require`-based `.js` files run with plain `node`) — see
Chapter 24 for the module systems this depends on.

## 23.8 A realistic end-to-end example

Below is the kind of pattern you'll write constantly in real applications:
fetch from a couple of independent "endpoints" in parallel, transform the
combined data, and handle failure gracefully without crashing the whole
operation. (See the example file for the full runnable version, using
`setTimeout`-based mock endpoints so it's deterministic and needs no
network access.)

```js
async function loadDashboard(userId) {
  try {
    // independent requests -> run in parallel
    const [profile, notifications] = await Promise.all([
      fetchProfile(userId),
      fetchNotifications(userId),
    ]);

    // this step genuinely depends on `profile` -> must be sequential
    const recommendations = await fetchRecommendations(profile.interests);

    return {
      profile,
      unreadCount: notifications.filter((n) => !n.read).length,
      recommendations,
    };
  } catch (err) {
    console.error("Dashboard failed to load:", err.message);
    // return a degraded-but-usable result instead of crashing the caller
    return { profile: null, unreadCount: 0, recommendations: [] };
  }
}
```

This function demonstrates the full toolkit from this chapter working
together: `async`/`await` for readable control flow, `Promise.all` for the
genuinely independent calls, a sequential `await` for the genuinely
dependent call, and `try`/`catch` for turning a failure into a safe
fallback instead of an unhandled rejection.

## 23.9 Chapter summary

- `async`/`await` is syntax sugar over promises — same event loop, same
  microtask semantics, more readable syntax.
- An `async` function always returns a promise; `return value` resolves it,
  `throw` rejects it.
- `await` pauses only the current async function (not the whole program)
  until its promise settles, and throws if the promise rejects.
- Use `try`/`catch`/`finally` around `await` for error handling.
- Independent async operations should be started together and awaited with
  `Promise.all`, not awaited one-by-one — sequential awaits (especially
  inside loops) are a common, costly performance mistake.
- Top-level `await` is legal in ES modules without wrapping in an `async`
  function.

## 23.10 Exercises

1. Run `examples/23-async-await.js` and note the timing difference printed
   between `loadDashboardSlow` and `loadDashboardFast`. Explain in your own
   words why the fast version isn't just "a bit" faster but roughly
   proportional to the *slowest single request* instead of the *sum* of
   all requests.
2. Take the `fetchAllSlow` loop example and modify it to process items in
   batches of 2 at a time (start 2, wait for both, start the next 2) —
   useful when full parallelism would overwhelm a rate-limited API. Hint:
   combine `for` with `Promise.all` over small slices of the array.
3. In `loadDashboard`, deliberately make `fetchNotifications` reject and
   confirm the `catch` block produces the degraded fallback instead of
   crashing the program.
