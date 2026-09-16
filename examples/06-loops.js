// Chapter 6 — Loops and Iteration
// Run with: node examples/06-loops.js

// 1. Classic for loop
for (let i = 0; i < 5; i++) {
  process.stdout.write(i + " ");
}
console.log();

for (let i = 0, j = 10; i < j; i++, j--) {
  console.log("multi-variable for:", i, j);
}

// 2. while and do-while
let count = 0;
while (count < 3) {
  console.log("while:", count);
  count++;
}

let m = 10;
do {
  console.log("do-while runs at least once even though condition is false:", m);
} while (m < 5);

// 3. for...of over arrays, strings, Set, Map
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) console.log("for...of array:", fruit);
for (const ch of "hi") console.log("for...of string:", ch);

const uniqueNums = new Set([1, 2, 2, 3]);
for (const num of uniqueNums) console.log("for...of Set:", num);

const map = new Map([["a", 1], ["b", 2]]);
for (const [key, value] of map) console.log("for...of Map:", key, value);

for (const [index, fruit] of fruits.entries()) {
  console.log("for...of entries:", index, fruit);
}

// 4. for...in over an object
const user = { name: "Alice", age: 30 };
for (const key in user) console.log("for...in object:", key, user[key]);

// 5. Why NOT to use for...in on arrays
const arr = ["a", "b", "c"];
for (const index in arr) {
  console.log("for...in array index type:", typeof index, index); // strings, not numbers!
}
Array.prototype.extra = "oops";
for (const key in arr) {
  console.log("for...in picks up prototype pollution:", key);
}
delete Array.prototype.extra;

// Safer alternatives:
for (const key of Object.keys(user)) console.log("Object.keys + for...of:", key);
for (const [key, value] of Object.entries(user)) {
  console.log("Object.entries + for...of:", key, value);
}

// 6. break and continue
for (let i = 0; i < 10; i++) {
  if (i === 5) break;
  console.log("break demo:", i);
}
for (let i = 0; i < 5; i++) {
  if (i % 2 === 0) continue;
  console.log("continue demo:", i);
}

// 7. Labeled loops
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (j === 1) continue outer;
    console.log("labeled continue:", i, j);
  }
}

search: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) break search;
    console.log("labeled break search:", i, j);
  }
}

// --- Exercises ---

// Exercise 1: even numbers with continue
const nums = [1, 2, 3, 4, 5, 6];
console.log("Exercise 1 -> even numbers:");
for (const n of nums) {
  if (n % 2 !== 0) continue;
  console.log(n);
}

// Exercise 2: break out of nested loops with a label
exercise2: for (let x = 0; x < 3; x++) {
  for (let y = 0; y < 3; y++) {
    if (x === 1 && y === 1) {
      console.log("Exercise 2 -> found x=1,y=1, breaking both loops");
      break exercise2;
    }
  }
}

// Exercise 3: for...in over an array is risky because index keys are
// strings, order is not strictly guaranteed for all key types, and any
// enumerable property added to the array or Array.prototype leaks in.
// Safer: for...of with .entries()
console.log("Exercise 3 -> safe entries iteration:");
for (const [i, v] of arr.entries()) {
  console.log(i, v);
}
