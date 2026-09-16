// CommonJS consumer — require() is synchronous and can be called anywhere
// Run with: node examples/24-modules/cjs/main.js

const { add, multiply } = require("./math.js");

console.log("add(2, 3) =", add(2, 3));           // 5
console.log("multiply(2, 3) =", multiply(2, 3)); // 6

// require() is just a function — it can be called conditionally,
// something ES modules' static `import` does not allow.
if (process.argv.includes("--extra")) {
  const path = require("path");
  console.log("Loaded conditionally:", path.basename(__filename));
}

// The module cache: requiring the same file twice returns the same object.
const mathAgain = require("./math.js");
console.log("Same cached module object?", require("./math.js") === mathAgain);
