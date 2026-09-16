// Chapter 23 — Async/Await
// Run with: node examples/23-async-await.js

function section(title) {
  console.log("\n=== " + title + " ===");
}

function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function fetchUser(id) {
  return delay(80, { id, name: "User" + id, interests: ["books", "hiking"] });
}
function fetchOrders(id) {
  return delay(60, [{ id: 900 + id, total: 42 }]);
}
function fetchInvoices(id) {
  return delay(70, [{ id: 500 + id, paid: true }]);
}

// ---------------------------------------------------------------------
// 1. async functions always return a promise
// ---------------------------------------------------------------------
async function getAnswer() {
  return 42;
}

async function demoAsyncReturnsPromise() {
  section("1. async functions always return a promise");
  const p = getAnswer();
  console.log("getAnswer() itself:", p); // Promise { 42 } (or pending, then settles)
  const value = await p;
  console.log("awaited value:", value);
}

// ---------------------------------------------------------------------
// 2. await + try/catch error handling
// ---------------------------------------------------------------------
function fetchUserStrict(id) {
  return delay(30).then(() => {
    if (id <= 0) throw new Error("Invalid user id: " + id);
    return { id, name: "User" + id };
  });
}

async function loadProfileSafely(id) {
  try {
    const user = await fetchUserStrict(id);
    console.log("User:", user.name);
  } catch (err) {
    console.error("Failed to load profile:", err.message);
  } finally {
    console.log("Done attempting to load profile for id", id);
  }
}

async function demoErrorHandling() {
  section("2. try/catch around await");
  await loadProfileSafely(1);
  await loadProfileSafely(-1);
}

// ---------------------------------------------------------------------
// 3. Sequential vs parallel awaits
// ---------------------------------------------------------------------
async function loadDashboardSlow() {
  const start = Date.now();
  const user = await fetchUser(1);
  const orders = await fetchOrders(1);
  const invoices = await fetchInvoices(1);
  return { user, orders, invoices, elapsedMs: Date.now() - start };
}

async function loadDashboardFast() {
  const start = Date.now();
  const [user, orders, invoices] = await Promise.all([
    fetchUser(1),
    fetchOrders(1),
    fetchInvoices(1),
  ]);
  return { user, orders, invoices, elapsedMs: Date.now() - start };
}

async function demoSequentialVsParallel() {
  section("3. Sequential vs parallel awaits");
  const slow = await loadDashboardSlow();
  console.log("Sequential (slow) took ~%dms (sum of all three)", slow.elapsedMs);
  const fast = await loadDashboardFast();
  console.log("Parallel (fast) took ~%dms (max of all three)", fast.elapsedMs);
}

// ---------------------------------------------------------------------
// 4. The loop mistake: await in a loop vs Promise.all with map
// ---------------------------------------------------------------------
async function fetchAllSlow(ids) {
  const results = [];
  for (const id of ids) {
    results.push(await fetchUser(id)); // one at a time
  }
  return results;
}

async function fetchAllFast(ids) {
  const promises = ids.map((id) => fetchUser(id)); // all started immediately
  return Promise.all(promises);
}

async function demoLoopMistake() {
  section("4. await-in-a-loop vs Promise.all(map)");
  const ids = [1, 2, 3, 4];

  let start = Date.now();
  await fetchAllSlow(ids);
  console.log("fetchAllSlow took ~%dms", Date.now() - start);

  start = Date.now();
  await fetchAllFast(ids);
  console.log("fetchAllFast took ~%dms", Date.now() - start);
}

// Exercise 2 solution: batched concurrency
async function fetchInBatches(ids, batchSize) {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((id) => fetchUser(id)));
    results.push(...batchResults);
  }
  return results;
}

async function demoBatching() {
  section("4b. Batched concurrency (batch size 2)");
  const start = Date.now();
  const results = await fetchInBatches([1, 2, 3, 4], 2);
  console.log("fetchInBatches took ~%dms, got %d users", Date.now() - start, results.length);
}

// ---------------------------------------------------------------------
// 5. Fire-and-forget with .catch
// ---------------------------------------------------------------------
function sendAnalytics(name) {
  return delay(20).then(() => {
    if (name === "boom") throw new Error("analytics endpoint down");
    console.log("  analytics sent:", name);
  });
}

function logAnalyticsEvent(name) {
  sendAnalytics(name).catch((err) => {
    console.error("  analytics failed (non-critical):", err.message);
  });
}

async function demoFireAndForget() {
  section("5. Fire-and-forget analytics call");
  logAnalyticsEvent("page_view"); // not awaited on purpose
  logAnalyticsEvent("boom");      // not awaited on purpose
  console.log("continued immediately without waiting for analytics");
  await delay(50); // just so the async logs above have time to print in this demo
}

// ---------------------------------------------------------------------
// 6. Realistic end-to-end dashboard example with graceful degradation
// ---------------------------------------------------------------------
function fetchProfile(userId) {
  return delay(50, { userId, interests: ["books", "hiking"] });
}
function fetchNotifications(userId, shouldFail) {
  return delay(40).then(() => {
    if (shouldFail) throw new Error("notifications service unavailable");
    return [
      { id: 1, read: false },
      { id: 2, read: true },
    ];
  });
}
function fetchRecommendations(interests) {
  return delay(30, interests.map((i) => "recommended:" + i));
}

async function loadDashboard(userId, notificationsShouldFail) {
  try {
    const [profile, notifications] = await Promise.all([
      fetchProfile(userId),
      fetchNotifications(userId, notificationsShouldFail),
    ]);

    const recommendations = await fetchRecommendations(profile.interests);

    return {
      profile,
      unreadCount: notifications.filter((n) => !n.read).length,
      recommendations,
    };
  } catch (err) {
    console.error("Dashboard failed to load:", err.message);
    return { profile: null, unreadCount: 0, recommendations: [] };
  }
}

async function demoDashboard() {
  section("6. Realistic dashboard example");
  const ok = await loadDashboard(1, false);
  console.log("Success case:", ok);
  const degraded = await loadDashboard(1, true);
  console.log("Graceful degradation case:", degraded);
}

// ---------------------------------------------------------------------
// Run everything in order (top-level await is not used here so this file
// also works as a plain CommonJS script with `node`, no ESM required).
// ---------------------------------------------------------------------
async function main() {
  await demoAsyncReturnsPromise();
  await demoErrorHandling();
  await demoSequentialVsParallel();
  await demoLoopMistake();
  await demoBatching();
  await demoFireAndForget();
  await demoDashboard();
}

main();
