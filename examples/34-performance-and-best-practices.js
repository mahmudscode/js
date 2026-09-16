// Chapter 34 — Performance and Best Practices
// Run with: node examples/34-performance-and-best-practices.js

// --- 1. Debounce ---------------------------------------------------
function debounce(fn, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

console.log("--- Debounce demo ---");
const debouncedSearch = debounce((query) => {
  console.log(`Searching for: "${query}" (only the last call should print)`);
}, 100);

// Simulate rapid typing — only the final call should actually fire,
// 100ms after the last keystroke.
["h", "he", "hel", "hell", "hello"].forEach((query, i) => {
  setTimeout(() => debouncedSearch(query), i * 20);
});

// --- 2. Throttle ---------------------------------------------------
function throttle(fn, intervalMs) {
  let isWaiting = false;
  return function (...args) {
    if (isWaiting) return;
    fn.apply(this, args);
    isWaiting = true;
    setTimeout(() => { isWaiting = false; }, intervalMs);
  };
}

setTimeout(() => {
  console.log("\n--- Throttle demo ---");
  const throttledLog = throttle((position) => {
    console.log(`Scroll handled at position ${position} (should print ~3 times, not 10)`);
  }, 60);

  // Simulate 10 rapid scroll events over ~180ms — throttle should let
  // roughly 3 of them through, not all 10.
  for (let i = 0; i < 10; i++) {
    setTimeout(() => throttledLog(i * 10), i * 18);
  }
}, 300);

// --- 3. Memoization performance comparison -----------------------
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function memoize(fn) {
  const cache = new Map();
  return function (n) {
    if (cache.has(n)) return cache.get(n);
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}

let memoFibonacci;
memoFibonacci = memoize(function (n) {
  if (n <= 1) return n;
  return memoFibonacci(n - 1) + memoFibonacci(n - 2);
});

setTimeout(() => {
  console.log("\n--- Memoization demo (fibonacci(32)) ---");

  console.time("naive fibonacci(32)");
  const naiveResult = fibonacci(32);
  console.timeEnd("naive fibonacci(32)");
  console.log("Result:", naiveResult);

  console.time("memoized fibonacci(32)");
  const memoResult = memoFibonacci(32);
  console.timeEnd("memoized fibonacci(32)");
  console.log("Result:", memoResult);

  console.log(
    "\nBoth results match:",
    naiveResult === memoResult,
    "— but watch how much faster the memoized version's console.time is."
  );
}, 700);

// --- 4. Early returns over deep nesting ---------------------------
function processOrderNested(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.paid) {
        return "shipped";
      }
    }
  }
  return null;
}

function processOrderFlat(order) {
  if (!order) return null;
  if (order.items.length === 0) return null;
  if (!order.paid) return null;
  return "shipped";
}

setTimeout(() => {
  console.log("\n--- Early returns vs nesting (same behavior) ---");
  const order = { items: ["book"], paid: true };
  console.log("Nested version:", processOrderNested(order));
  console.log("Flat version:  ", processOrderFlat(order));
}, 750);
