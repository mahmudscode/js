// Chapter 4 — Operators
// Run with: node examples/04-operators.js

// 1. Arithmetic
console.log("5 % 3 =", 5 % 3);
console.log("5 ** 3 =", 5 ** 3);
let n = 5;
console.log("post-increment n++ returns", n++, "then n is", n);
n = 5;
console.log("pre-increment ++n returns", ++n, "and n is", n);

// 2. Assignment + logical assignment operators
let a = null;
a ??= "default";
console.log("a ??= 'default' ->", a);

let count = 0;
count ||= 10;
console.log("count ||= 10 (0 is falsy) ->", count);

let config = { theme: "dark" };
config.theme &&= "light";
console.log("config.theme &&= 'light' ->", config.theme);

// 3. == vs ===
console.log('5 === "5":', 5 === "5");
console.log('5 == "5":', 5 == "5");
console.log("null === undefined:", null === undefined);
console.log("null == undefined:", null == undefined);
console.log('0 == "":', 0 == "");
console.log('"" == "0":', "" == "0"); // famous non-transitive surprise
console.log("NaN == NaN:", NaN == NaN);
console.log('"10" > "9" (string comparison):', "10" > "9");
console.log('"10" > 9 (coerced to number):', "10" > 9);

// 4. && and || returning operand values, not just booleans
console.log('0 && "hello" ->', 0 && "hello");
console.log('1 && "hello" ->', 1 && "hello");
console.log('0 || "default" ->', 0 || "default");
console.log('0 || "" || null || "last" ->', 0 || "" || null || "last");

function getUser() {
  return null;
}
const name = getUser() || "Guest";
console.log("|| default pattern:", name);

// 5. Nullish coalescing fixes the 0/''/false default-value bug
const count1 = 0;
console.log("count1 || 10 (wrong if 0 is valid):", count1 || 10);
console.log("count1 ?? 10 (correct):", count1 ?? 10);

function getConfig(options) {
  return options.retries ?? 3;
}
console.log("getConfig({ retries: 0 }):", getConfig({ retries: 0 }));
console.log("getConfig({}):", getConfig({}));

// 6. Optional chaining
const user = { profile: { name: "Alice" } };
console.log("user.profile?.name:", user.profile?.name);
console.log("user.address?.city:", user.address?.city);
console.log("user.sayHi?.():", user.sayHi?.());
console.log("user.profile?.tags?.[0]:", user.profile?.tags?.[0]);
const arrNull = null;
console.log("arrNull?.[0]:", arrNull?.[0]);
console.log("combined ?. and ??:", user.address?.city ?? "Unknown");

// 7. Ternary
const age = 20;
console.log("ternary category:", age >= 18 ? "adult" : "minor");
const grade = 85;
const letter = grade >= 90 ? "A" : grade >= 80 ? "B" : grade >= 70 ? "C" : "F";
console.log("chained ternary letter grade:", letter);

// 8. typeof, instanceof, in, delete
console.log("typeof 42:", typeof 42);
const now = new Date();
console.log("now instanceof Date:", now instanceof Date);
console.log("[] instanceof Array:", [] instanceof Array);
console.log("[] instanceof Object:", [] instanceof Object);

const objWithName = { name: "Alice" };
console.log('"name" in objWithName:', "name" in objWithName);
console.log('"toString" in objWithName (inherited):', "toString" in objWithName);
console.log("hasOwnProperty toString:", objWithName.hasOwnProperty("toString"));
delete objWithName.name;
console.log("after delete:", objWithName);

// 9. Bitwise
console.log("5 & 1 =", 5 & 1);
console.log("5 | 1 =", 5 | 1);
console.log("5 ^ 1 =", 5 ^ 1);
console.log("~5 =", ~5);
console.log("5 << 1 =", 5 << 1);
console.log("5 >> 1 =", 5 >> 1);
console.log("~~4.7 (truncate) =", ~~4.7);

// 10. Precedence surprises
console.log("2 + 3 * 4 =", 2 + 3 * 4);
console.log('typeof 1 + 1 =', typeof 1 + 1); // "number1"

// --- Exercises ---
console.log('Exercise 1 -> "5" + 3 - 1 =', "5" + 3 - 1); // "53" - 1 -> 52
console.log('Exercise 1 -> 5 + 3 + "1" =', 5 + 3 + "1"); // 8 + "1" -> "81"

function withTimeout(options) {
  return options.timeout ?? 5000; // Exercise 2: ?? respects an explicit 0
}
console.log("Exercise 2 -> withTimeout({ timeout: 0 }):", withTimeout({ timeout: 0 }));

const userEx3 = {};
console.log("Exercise 3 -> theme:", userEx3.settings?.theme ?? "light");
