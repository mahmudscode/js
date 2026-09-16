// ES Module consumer — import must be a top-level, static string literal
// Run with: node examples/24-modules/esm/main.mjs

import { add, multiply, PI } from "./math.mjs";

console.log("add(2, 3) =", add(2, 3));           // 5
console.log("multiply(2, 3) =", multiply(2, 3)); // 6
console.log("PI =", PI);

// `this` at the top level of an ES module is undefined (unlike CommonJS,
// where top-level `this` is module.exports).
console.log("top-level this:", this);

// Dynamic import() works everywhere (even conditionally) and returns a
// Promise — useful for lazy-loading modules.
if (process.argv.includes("--dynamic")) {
  const { PI: piAgain } = await import("./math.mjs");
  console.log("Dynamically imported PI:", piAgain);
}
