// Chapter 8 — Arrays
// Run with: node examples/08-arrays.js

// 8.1 Basics
const fruits = ["apple", "banana", "cherry"];
console.log("8.1", fruits[0], fruits.length, typeof fruits, Array.isArray(fruits));

// 8.2 Creating arrays
const fromLiteral = [1, 2, 3];
const fromLength = Array.from({ length: 5 }, (_, i) => i * 2);
const fromOf = Array.of(5);
console.log("8.2", fromLength, fromOf);
console.log("8.2 Array.from string:", Array.from("hello"));
console.log("8.2 Array.from Set:", Array.from(new Set([1, 2, 2, 3])));

// 8.3 Indexing & length
const arr = [10, 20, 30];
console.log("8.3", arr[10], arr[-1], arr.at(-1));
const nums = [1, 2, 3, 4, 5];
nums.length = 3;
console.log("8.3 truncated:", nums);

// 8.4 Mutating methods
const stack = [1, 2, 3];
stack.push(4);
const popped = stack.pop();
console.log("8.4 stack:", stack, "popped:", popped);

const letters = ["a", "b", "c", "d", "e"];
const removed = letters.splice(1, 2, "x", "y", "z");
console.log("8.4 splice result:", letters, "removed:", removed);

// 8.5 Non-mutating methods
const data = [5, 3, 8, 1, 9, 2];
console.log("8.5 slice:", data.slice(1, 4), "original untouched:", data);
console.log("8.5 map:", data.map(n => n * 2));
console.log("8.5 filter:", data.filter(n => n > 4));
console.log("8.5 reduce sum:", data.reduce((sum, n) => sum + n, 0));

// reduce: group by property
const people = [
  { name: "Ana", dept: "eng" },
  { name: "Bo", dept: "sales" },
  { name: "Cy", dept: "eng" },
];
const byDept = people.reduce((groups, person) => {
  (groups[person.dept] ??= []).push(person.name);
  return groups;
}, {});
console.log("8.5 grouped:", byDept);

console.log("8.5 flat:", [1, [2, 3], [4, [5, 6]]].flat());
console.log("8.5 flat(2):", [1, [2, 3], [4, [5, 6]]].flat(2));
console.log("8.5 flatMap:", ["hello world", "foo bar"].flatMap(s => s.split(" ")));

// 8.6 Searching
const users = [
  { id: 1, name: "Ana", active: true },
  { id: 2, name: "Bo", active: false },
];
console.log("8.6 find:", users.find(u => u.id === 2));
console.log("8.6 includes object by ref (false):", [{ id: 1 }].includes({ id: 1 }));

// 8.7 Sorting footgun
console.log("8.7 default sort (lexicographic):", [10, 1, 21, 2].sort());
console.log("8.7 numeric sort asc:", [10, 1, 21, 2].sort((a, b) => a - b));
console.log("8.7 numeric sort desc:", [10, 1, 21, 2].sort((a, b) => b - a));

// 8.8 Multi-dimensional arrays
const rows = 3, cols = 3;
const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
grid[0][0] = 9;
console.log("8.8 grid:", grid, "row1col0 (should be 0):", grid[1][0]);

// 8.9 Sparse arrays skip in forEach but not in for-loop
const sparse = [1, , 3];
const forEachSeen = [];
sparse.forEach(x => forEachSeen.push(x));
console.log("8.9 forEach skips holes:", forEachSeen);
const forLoopSeen = [];
for (let i = 0; i < sparse.length; i++) forLoopSeen.push(sparse[i]);
console.log("8.9 for-loop sees holes as undefined:", forLoopSeen);

// 8.10 Destructuring preview
const [first, second, ...rest] = [1, 2, 3, 4, 5];
console.log("8.10 destructure:", first, second, rest);
