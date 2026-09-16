// Chapter 5 — Control Flow
// Run with: node examples/05-control-flow.js

// 1. if / else if / else
function greetByHour(hour) {
  if (hour < 12) return "Good morning";
  else if (hour < 18) return "Good afternoon";
  else return "Good evening";
}
console.log(greetByHour(9), greetByHour(14), greetByHour(20));

const username = "";
if (username) {
  console.log(`Hello, ${username}`);
} else {
  console.log("No username provided"); // runs, "" is falsy
}

// 2. Guard clauses vs nested ifs
function processOrderNested(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.paid) {
        return "Processing order";
      } else {
        return "Order not paid";
      }
    } else {
      return "Empty order";
    }
  } else {
    return "No order provided";
  }
}

function processOrder(order) {
  if (!order) return "No order provided";
  if (order.items.length === 0) return "Empty order";
  if (!order.paid) return "Order not paid";
  return "Processing order";
}

const sampleOrder = { items: [1], paid: true };
console.log("nested:", processOrderNested(sampleOrder));
console.log("guard clause:", processOrder(sampleOrder));
console.log("guard clause, no order:", processOrder(null));

// 3. Truthy / falsy
const values = [false, 0, -0, 0n, "", null, undefined, NaN, "0", [], {}, " ", "false", -1];
for (const v of values) {
  const label = typeof v === "bigint" ? `${v}n` : Number.isNaN(v) ? "NaN" : JSON.stringify(v);
  console.log(`${label} is ${v ? "truthy" : "falsy"}`);
}

// 4. switch fallthrough
function describe(n) {
  let result = "";
  switch (n) {
    case 1:
      result += "one ";
    // falls through intentionally for this demo
    case 2:
      result += "two ";
      break;
    case 3:
      result += "three";
      break;
  }
  return result;
}
console.log("describe(1) [fallthrough]:", describe(1));
console.log("describe(2):", describe(2));

// 5. switch vs object lookup
const dayType = {
  MON: "Weekday", TUE: "Weekday", WED: "Weekday",
  THU: "Weekday", FRI: "Weekday",
  SAT: "Weekend", SUN: "Weekend",
};
console.log("object lookup for TUE:", dayType["TUE"] ?? "Invalid day");
console.log("object lookup for XXX:", dayType["XXX"] ?? "Invalid day");

// 6. Ternary vs if/else
const isActive = true;
const status = isActive ? "Active" : "Inactive";
console.log("ternary status:", status);

// 7. Common control-flow bugs
function processCount(count) {
  if (!count) return "no count given"; // bug: 0 is falsy
  return `count is ${count}`;
}
function processCountFixed(count) {
  if (count === undefined || count === null) return "no count given";
  return `count is ${count}`;
}
console.log("buggy processCount(0):", processCount(0));
console.log("fixed processCountFixed(0):", processCountFixed(0));

function isValidIndex(arr, index) {
  return index >= 0 && index < arr.length;
}
console.log("isValidIndex([1,2,3], 3):", isValidIndex([1, 2, 3], 3));
console.log("isValidIndex([1,2,3], 2):", isValidIndex([1, 2, 3], 2));

function categorizeScore(score) {
  if (score >= 0) return "non-negative"; // swallows the "excellent" branch below
  if (score >= 90) return "excellent";
  return "other";
}
function categorizeScoreFixed(score) {
  if (score >= 90) return "excellent";
  if (score >= 0) return "non-negative";
  return "other";
}
console.log("buggy categorizeScore(95):", categorizeScore(95));
console.log("fixed categorizeScoreFixed(95):", categorizeScoreFixed(95));

// 8. Multi-value comparisons with .includes()
function isWeekend(day) {
  return ["SAT", "SUN"].includes(day);
}
function isVowel(char) {
  return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
}
console.log("isWeekend('SUN'):", isWeekend("SUN"), "isVowel('E'):", isVowel("E"));

// --- Exercises ---

// Exercise 2: status code lookup table
const statusCategory = {
  200: "success", 201: "success", 204: "success",
  400: "client error", 404: "client error",
  500: "server error",
};
function categorize(code) {
  return statusCategory[code] ?? "unknown";
}
console.log("Exercise 2 -> categorize(404):", categorize(404));
console.log("Exercise 2 -> categorize(200):", categorize(200));
console.log("Exercise 2 -> categorize(999):", categorize(999));
