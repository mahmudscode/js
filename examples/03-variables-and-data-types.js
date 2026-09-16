// Chapter 3 — Variables and Data Types
// Run with: node examples/03-variables-and-data-types.js

// 1. const prevents reassignment, not mutation
const arr = [1, 2, 3];
arr.push(4);
console.log("mutated const array:", arr); // [1, 2, 3, 4]
try {
  arr = [5, 6];
} catch (err) {
  console.log("reassigning const array threw:", err.constructor.name);
}

const user = { name: "Alice" };
user.name = "Bob";
user.age = 30;
console.log("mutated const object:", user);

const frozen = Object.freeze({ name: "Alice" });
frozen.name = "Bob"; // silently fails (not in strict mode file-wide, but freeze still blocks it)
console.log("frozen object unchanged:", frozen.name);

// 2. var is function-scoped, let/const are block-scoped
function varScopeDemo() {
  if (true) {
    var x = 10;
  }
  return x; // still visible outside the if-block
}
console.log("var leaks out of block:", varScopeDemo());

function letScopeDemo() {
  if (true) {
    let y = 10;
  }
  try {
    // eslint-disable-next-line no-undef
    return y;
  } catch (err) {
    return `threw: ${err.constructor.name}`;
  }
}
console.log("let stays in block:", letScopeDemo());

// 3. The classic var-in-loop closure bug, and the let fix
const varResults = [];
for (var i = 0; i < 3; i++) {
  varResults.push(() => i);
}
console.log("var loop callbacks all see final i:", varResults.map((fn) => fn()));

const letResults = [];
for (let j = 0; j < 3; j++) {
  letResults.push(() => j);
}
console.log("let loop callbacks each see their own j:", letResults.map((fn) => fn()));

// 4. Temporal Dead Zone
function tdzDemo() {
  try {
    console.log(letVariable);
    let letVariable = "hello";
  } catch (err) {
    return `threw: ${err.constructor.name}: ${err.message}`;
  }
}
console.log("TDZ access before declaration:", tdzDemo());

// 5. undefined vs null
let neverAssigned;
let intentionallyEmpty = null;
console.log("undefined:", neverAssigned, typeof neverAssigned);
console.log("null:", intentionallyEmpty, typeof intentionallyEmpty);
console.log("null == undefined:", null == undefined);
console.log("null === undefined:", null === undefined);

// 6. Symbol uniqueness
const id1 = Symbol("id");
const id2 = Symbol("id");
console.log("two symbols with same description are never equal:", id1 === id2);
const withSymbolKey = { name: "Alice", [id1]: "hidden" };
console.log("Object.keys ignores symbol keys:", Object.keys(withSymbolKey));

// 7. BigInt precision
console.log("MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);
console.log("MAX_SAFE_INTEGER + 1:", Number.MAX_SAFE_INTEGER + 1);
console.log("MAX_SAFE_INTEGER + 2 (precision lost):", Number.MAX_SAFE_INTEGER + 2);
const big = 9007199254740993n;
console.log("BigInt stays exact:", (big + 1n).toString());

// 8. typeof quirks
console.log("typeof null:", typeof null); // "object" -- historic bug
console.log("typeof []:", typeof []);     // "object"
console.log("Array.isArray([]):", Array.isArray([]));
console.log("typeof NaN:", typeof NaN);   // "number"

// 9. NaN's self-inequality and isNaN vs Number.isNaN
console.log("NaN === NaN:", NaN === NaN); // false
console.log("global isNaN(undefined):", isNaN(undefined)); // true (misleading, coerces first)
console.log("Number.isNaN(undefined):", Number.isNaN(undefined)); // false (correct)
console.log("Number.isNaN(NaN):", Number.isNaN(NaN)); // true

// 10. Value vs. reference semantics
let px = 10;
let py = px;
py = 20;
console.log("primitives copy by value, px unaffected:", px, py);

let obj1 = { value: 10 };
let obj2 = obj1;
obj2.value = 20;
console.log("objects copy by reference, obj1 sees the change:", obj1.value);

function addAdmin(u) {
  u.role = "admin";
}
const me = { name: "Alice" };
addAdmin(me);
console.log("mutating a passed object affects the caller:", me);

// --- Exercises ---

// Exercise 2: deepEqualPrimitive using Object.is (handles NaN correctly)
function deepEqualPrimitive(a, b) {
  return Object.is(a, b);
}
console.log("Exercise 2 -> deepEqualPrimitive(NaN, NaN):", deepEqualPrimitive(NaN, NaN)); // true

// Exercise 3: shared reference demo
const list = [1, 2, 3];
const copy = list;
copy.push(4);
console.log("Exercise 3 -> list and copy are the same array:", list, copy);
