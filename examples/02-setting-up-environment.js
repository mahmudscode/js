// Chapter 2 — Setting Up Your Environment
// Run with: node examples/02-setting-up-environment.js

// 1. Basic console.log
console.log("Hello, JavaScript!");

// 2. console.warn and console.error (colored differently in most terminals
// and consoles; console.error also prints a stack trace in the browser)
console.warn("something looks off");
console.error("something broke");

// 3. console.table — renders tabular data legibly
console.table([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]);

// 4. console.group / groupEnd — indents related logs together
console.group("User validation");
console.log("checking name...");
console.log("checking email...");
console.groupEnd();

// 5. console.time / timeEnd — quick micro-benchmarking
console.time("loop");
let sum = 0;
for (let i = 0; i < 1e6; i++) {
  sum += i;
}
console.timeEnd("loop");
console.log("sum:", sum);

// 6. console.count — counts how many times it has been called with a label
console.count("call");
console.count("call");
console.count("call");

// 7. console.assert — only logs when the assertion is false
console.assert(1 === 2, "1 is not 2"); // logs, because 1 === 2 is false
console.assert(1 === 1, "this will never print"); // silent, assertion is true

// 8. Strict mode behavior demo, isolated in its own function so it doesn't
// affect the rest of this file.
function sloppyModeDemo() {
  undeclaredGlobal = "oops"; // no 'use strict' here -> silently creates a global
  return typeof undeclaredGlobal;
}
console.log("sloppy mode created a global:", sloppyModeDemo());

function strictModeDemo() {
  "use strict";
  try {
    // eslint-disable-next-line no-undef
    thisWillThrow = "oops"; // 'use strict' -> throws ReferenceError instead
    return "no error (unexpected)";
  } catch (err) {
    return `threw: ${err.constructor.name}: ${err.message}`;
  }
}
console.log("strict mode result:", strictModeDemo());

// 9. Exercise 2 solution: sum 1..10 with a for loop
let total = 0;
for (let i = 1; i <= 10; i++) {
  total += i;
}
console.log("sum of 1..10:", total);

// 10. Environment info
console.log("Node.js version:", process.version);
console.log("Platform:", process.platform);
