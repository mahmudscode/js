// Chapter 18 — Error Handling
// Run with: node examples/18-error-handling.js

// --- 18.2 try/catch/finally ---
try {
  const result = JSON.parse("{ invalid json");
  console.log(result);
} catch (error) {
  console.log("Parsing failed:", error.message);
} finally {
  console.log("This always runs, error or not.");
}

function readConfig() {
  console.log("opening resource...");
  try {
    throw new Error("disk read failed");
  } finally {
    console.log("closing resource...");
  }
}
try {
  readConfig();
} catch (e) {
  console.log("caught at outer level:", e.message);
}

try {
  throw new Error("ignored details");
} catch {
  console.log("Something went wrong, but we don't need the details here.");
}

// --- 18.3 throw Error objects, not bare values ---
function divide(a, b) {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}
try {
  divide(10, 0);
} catch (error) {
  console.log(error.message);
  console.log(error instanceof Error);
  console.log(typeof error.stack);
}

// --- 18.4 Custom error types ---
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
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
    throw error;
  }
}

// --- 18.5 Error propagation ---
function level3() {
  throw new Error("failure deep in level3");
}
function level2() {
  level3();
}
function level1() {
  level2();
}
try {
  level1();
} catch (error) {
  console.log("Caught at the top:", error.message);
}

// --- 18.6 try/catch with async/await (preview) ---
async function fetchUserSafely(shouldFail) {
  try {
    if (shouldFail) throw new Error("Request failed with status 500");
    return { id: 1, name: "Ada" };
  } catch (error) {
    console.log("Failed to fetch user:", error.message);
    return null;
  }
}

// --- 18.7 Defensive vs fail-fast ---
function getUserNameBad(user) {
  try {
    return user.profile.name.toUpperCase();
  } catch {
    return "Unknown";
  }
}
function getUserNameBetter(user) {
  if (!user?.profile?.name) return "Unknown";
  return user.profile.name.toUpperCase();
}
console.log(getUserNameBad({}));
console.log(getUserNameBetter({}));
console.log(getUserNameBetter({ profile: { name: "grace" } }));

// --- Exercise solutions ---
function parseJsonSafely(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
console.log(parseJsonSafely('{"ok":true}'));
console.log(parseJsonSafely("not json"));

class InsufficientFundsError extends Error {
  constructor(amount, balance) {
    super(`Cannot withdraw ${amount}, balance is only ${balance}`);
    this.name = "InsufficientFundsError";
  }
}
function withdraw(balance, amount) {
  if (amount > balance) throw new InsufficientFundsError(amount, balance);
  return balance - amount;
}
try {
  withdraw(50, 100);
} catch (e) {
  if (e instanceof InsufficientFundsError) {
    console.log("Friendly message:", e.message);
  } else {
    throw e;
  }
}

console.log("--- exercise 3 order ---");
try {
  console.log("A");
  throw new Error("boom");
} catch {
  console.log("B");
} finally {
  console.log("C");
}
// Output order: A, B, C

(async () => {
  await fetchUserSafely(true);
  const user = await fetchUserSafely(false);
  console.log("fetched user:", user);
})();
