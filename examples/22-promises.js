// Chapter 22 — Promises
// Run with: node examples/22-promises.js

function section(title) {
  console.log("\n=== " + title + " ===");
}

// Mock "network" helpers — all deterministic, all offline.
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) {
        reject(new Error("Invalid user id: " + id));
      } else {
        resolve({ id, name: "User" + id, membership: id % 2 === 0 ? "gold" : "silver" });
      }
    }, 20);
  });
}

function fetchOrders(userId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 100 + userId, total: 25 * userId }]), 15);
  });
}

// ---------------------------------------------------------------------
// 1. Basic promise creation and states
// ---------------------------------------------------------------------
section("1. Creating and consuming a promise");

const coinFlip = new Promise((resolve, reject) => {
  const success = true; // fixed for deterministic output
  setTimeout(() => {
    if (success) resolve("Operation succeeded!");
    else reject(new Error("Operation failed!"));
  }, 20);
});

coinFlip
  .then((result) => console.log("Success:", result))
  .catch((error) => console.error("Error:", error.message))
  .finally(() => console.log("finally: always runs"));

// ---------------------------------------------------------------------
// 2. Chaining: returning a value vs returning a promise
// ---------------------------------------------------------------------
setTimeout(() => {
  section("2. Chaining promises");

  fetchUser(1)
    .then((user) => {
      console.log("Got user:", user.name);
      return fetchOrders(user.id); // returning a PROMISE -> chain waits
    })
    .then((orders) => {
      console.log("Got orders:", orders.length);
      return orders.length; // returning a plain VALUE
    })
    .then((count) => {
      console.log("Order count:", count);
    })
    .catch((err) => {
      console.error("Pipeline failed:", err.message);
    });
}, 100);

// ---------------------------------------------------------------------
// 3. The "forgot to return" bug, demonstrated and then fixed
// ---------------------------------------------------------------------
function demonstrateReturnBug() {
  section("3. Forgot-to-return bug vs fixed version");

  // BUGGY: inner promise is not returned
  fetchUser(2).then((user) => {
    fetchOrders(user.id).then((orders) => {
      console.log("  [buggy]  inner orders arrived:", orders.length);
    });
    return "outer chain moved on already";
  }).then((message) => {
    console.log("  [buggy]  outer .then got:", message, "(did NOT wait for orders)");
  });

  // FIXED: inner promise is returned, so the chain actually waits
  fetchUser(2)
    .then((user) => {
      return fetchOrders(user.id); // <-- the fix
    })
    .then((orders) => {
      console.log("  [fixed]  outer .then got orders:", orders.length, "(waited correctly)");
    });
}
setTimeout(demonstrateReturnBug, 200);

// ---------------------------------------------------------------------
// 4. Promise.all vs Promise.allSettled vs Promise.race vs Promise.any
// ---------------------------------------------------------------------
setTimeout(() => {
  section("4a. Promise.all (fails fast)");
  Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])
    .then((users) => console.log("All succeeded:", users.map((u) => u.name)))
    .catch((err) => console.error("Promise.all rejected:", err.message));

  Promise.all([fetchUser(1), fetchUser(-1), fetchUser(3)])
    .then((users) => console.log("Should not print:", users))
    .catch((err) => console.error("Promise.all rejected as expected:", err.message));
}, 300);

setTimeout(() => {
  section("4b. Promise.allSettled (never short-circuits)");
  Promise.allSettled([fetchUser(1), fetchUser(-1), fetchUser(3)]).then((results) => {
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        console.log(`  result ${i}: fulfilled ->`, result.value.name);
      } else {
        console.log(`  result ${i}: rejected  ->`, result.reason.message);
      }
    });
  });
}, 400);

setTimeout(() => {
  section("4c. Promise.race (first to settle wins)");
  const fast = new Promise((resolve) => setTimeout(() => resolve("fast"), 10));
  const slow = new Promise((resolve) => setTimeout(() => resolve("slow"), 100));
  Promise.race([fast, slow]).then((winner) => console.log("Race winner:", winner));
}, 500);

setTimeout(() => {
  section("4d. Promise.any (first SUCCESS wins, ignores rejections)");
  const bad1 = Promise.reject(new Error("mirror 1 down"));
  const bad2 = Promise.reject(new Error("mirror 2 down"));
  const good = new Promise((resolve) => setTimeout(() => resolve("mirror 3 data"), 10));
  Promise.any([bad1, bad2, good]).then((value) => console.log("First success:", value));
}, 600);

// ---------------------------------------------------------------------
// 5. Promisifying a callback-based API
// ---------------------------------------------------------------------
function readFileCallback(path, callback) {
  setTimeout(() => {
    if (path === "missing.txt") callback(new Error("ENOENT: no such file"));
    else callback(null, "file contents for " + path);
  }, 10);
}

function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    readFileCallback(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

setTimeout(() => {
  section("5. Promisifying a callback API");
  readFilePromise("notes.txt")
    .then((data) => console.log("Read:", data))
    .catch((err) => console.error("Failed:", err.message));

  readFilePromise("missing.txt")
    .then((data) => console.log("Read:", data))
    .catch((err) => console.error("Failed (expected):", err.message));
}, 700);

// ---------------------------------------------------------------------
// 6. withTimeout helper built on Promise.race (exercise 3 solution)
// ---------------------------------------------------------------------
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timed out")), ms)
  );
  return Promise.race([promise, timeout]);
}

setTimeout(() => {
  section("6. withTimeout helper");
  const slowFetch = new Promise((resolve) => setTimeout(() => resolve("data"), 500));
  withTimeout(slowFetch, 100)
    .then((data) => console.log("Got:", data))
    .catch((err) => console.error("withTimeout correctly rejected:", err.message));
}, 800);
