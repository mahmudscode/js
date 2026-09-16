// Chapter 21 — Callbacks and the Event Loop
// Run with: node examples/21-callbacks-event-loop.js

function section(title) {
  console.log("\n=== " + title + " ===");
}

// ---------------------------------------------------------------------
// 1. Synchronous vs asynchronous execution
// ---------------------------------------------------------------------
section("1. Synchronous vs asynchronous");

console.log("A");
setTimeout(() => console.log("B (async, runs later)"), 0);
console.log("C");
// Output order: A, C, B

// ---------------------------------------------------------------------
// 2. The call stack (traced manually via console.log)
// ---------------------------------------------------------------------
section("2. The call stack");

function multiply(a, b) {
  return a * b;
}
function square(n) {
  return multiply(n, n);
}
function printSquare(n) {
  console.log("square of", n, "=", square(n));
}
printSquare(5);

// ---------------------------------------------------------------------
// 3. Error-first callback convention (Node style)
// ---------------------------------------------------------------------
section("3. Error-first callbacks");

function readConfigFake(path, callback) {
  // Simulates an async file read without touching the real filesystem.
  setTimeout(() => {
    if (path !== "config.json") {
      callback(new Error("File not found: " + path));
      return;
    }
    callback(null, { port: 3000, debug: true });
  }, 10);
}

readConfigFake("config.json", (err, data) => {
  if (err) {
    console.error("Failed:", err.message);
    return;
  }
  console.log("Config loaded:", data);
});

readConfigFake("missing.json", (err, data) => {
  if (err) {
    console.error("Failed:", err.message);
    return;
  }
  console.log("Config loaded:", data);
});

// ---------------------------------------------------------------------
// 4. Callback hell — a real nested example
// ---------------------------------------------------------------------
section("4. Callback hell (pyramid of doom)");

function getUser(id, cb) {
  setTimeout(() => cb(null, { id, name: "Ava", membership: "gold" }), 5);
}
function getOrders(userId, cb) {
  setTimeout(() => cb(null, [{ id: 101, total: 40 }]), 5);
}
function getOrderDetails(orderId, cb) {
  setTimeout(() => cb(null, { orderId, weightKg: 2 }), 5);
}
function calculateShipping(details, cb) {
  setTimeout(() => cb(null, details.weightKg * 5), 5);
}
function applyDiscount(shippingCost, membership, cb) {
  setTimeout(() => {
    const discount = membership === "gold" ? 0.5 : 1;
    cb(null, shippingCost * discount);
  }, 5);
}
function handleError(err) {
  console.error("Pipeline failed:", err.message);
}

getUser(1, function (err, user) {
  if (err) return handleError(err);
  getOrders(user.id, function (err, orders) {
    if (err) return handleError(err);
    getOrderDetails(orders[0].id, function (err, details) {
      if (err) return handleError(err);
      calculateShipping(details, function (err, shipping) {
        if (err) return handleError(err);
        applyDiscount(shipping, user.membership, function (err, final) {
          if (err) return handleError(err);
          console.log("Final shipping price:", final);
        });
      });
    });
  });
});

// ---------------------------------------------------------------------
// 5. The event loop ordering puzzle
// ---------------------------------------------------------------------
function orderingPuzzle() {
  section("5. Event loop ordering puzzle");

  console.log("1: script start");

  setTimeout(() => console.log("2: setTimeout callback"), 0);

  Promise.resolve()
    .then(() => console.log("3: promise .then #1"))
    .then(() => console.log("4: promise .then #2"));

  queueMicrotask(() => console.log("5: queueMicrotask"));

  console.log("6: script end");

  // Expected order: 1, 6, 3, 5, 4, 2
  // Reasoning:
  //  - 1 and 6 are synchronous, run first, in order.
  //  - Once the stack is empty, ALL microtasks drain before the next
  //    macrotask: the first .then (3) runs, which enqueues the second
  //    .then (4) as a NEW microtask — it still runs before setTimeout.
  //    queueMicrotask (5) was queued before that second .then, so it
  //    runs before 4, giving 3, 5, 4.
  //  - Only after the microtask queue is fully empty does the event loop
  //    take the one pending macrotask: setTimeout's callback (2).
}
orderingPuzzle();

// ---------------------------------------------------------------------
// 6. setInterval + queueMicrotask race (run last, own section)
// ---------------------------------------------------------------------
setTimeout(() => {
  section("6. setInterval vs queueMicrotask");
  let count = 0;
  const intervalId = setInterval(() => {
    count++;
    console.log("tick (macrotask)", count);
    queueMicrotask(() => console.log("  -> microtask queued during tick", count));
    if (count === 3) {
      clearInterval(intervalId);
      console.log("interval cleared");
    }
  }, 50);
}, 200); // scheduled after everything above to keep output easy to read
