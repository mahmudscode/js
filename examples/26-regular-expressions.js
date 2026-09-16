// Chapter 26 — Regular Expressions
// Run with: node examples/26-regular-expressions.js

// --- 1. Literal vs constructor ---
const re1 = /hello/;
const re2 = new RegExp("hello", "i");
console.log(re1.test("hello world"));  // true
console.log(re2.test("HELLO world"));  // true (case-insensitive)

// --- 2. Flags ---
console.log("a1 b2 c3".match(/\d/g));  // [ '1', '2', '3' ]

// --- 3. Character classes ---
console.log(/\d{3}-\d{4}/.test("555-1234")); // true
console.log(/[aeiou]/.test("sky"));           // false

// --- 4. Quantifiers: greedy vs lazy ---
console.log("<a><b>".match(/<.+>/)[0]);   // "<a><b>"
console.log("<a><b>".match(/<.+?>/)[0]);  // "<a>"

// --- 5. Anchors and word boundaries ---
console.log(/^cat$/.test("cat"));       // true
console.log(/^cat$/.test("concat"));    // false
console.log(/\bcat\b/.test("concat"));  // false
console.log(/\bcat\b/.test("a cat!"));  // true

// --- 6. Capturing groups ---
const dateMatch = "2024-01-15".match(/(\d{4})-(\d{2})-(\d{2})/);
console.log(dateMatch[0], dateMatch[1], dateMatch[2], dateMatch[3]);
// 2024-01-15 2024 01 15

// --- 7. Named groups ---
const { groups } = "2024-01-15".match(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
);
console.log(groups.year, groups.month, groups.day); // 2024 01 15

// --- 8. exec() in a loop (manual global iteration) ---
const re = /\d+/g;
let m;
const found = [];
while ((m = re.exec("a1 b22 c333")) !== null) {
  found.push({ value: m[0], index: m.index });
}
console.log(found);
// [ { value: '1', index: 1 }, { value: '22', index: 4 }, { value: '333', index: 8 } ]

// --- 9. matchAll() — the safer modern alternative ---
for (const match of "a1 b22 c333".matchAll(/\d+/g)) {
  console.log(match[0], "at index", match.index);
}

// --- 10. Replace with capture group references ---
console.log("2024-01-15".replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1"));
// 01/15/2024

console.log(
  "2024-01-15".replace(
    /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/,
    "$<month>/$<day>/$<year>"
  )
);
// 01/15/2024

// --- 11. Replace with a function ---
console.log(
  "price: 5, qty: 3".replace(/\d+/g, (match) => String(Number(match) * 2))
);
// price: 10, qty: 6

// --- 12. Practical patterns ---
console.log("  hi  ".replace(/^\s+|\s+$/g, "")); // "hi"

console.log("Order #123 has 4 items at $5.99".match(/\d+(\.\d+)?/g));
// [ '123', '4', '5.99' ]

console.log("a, b; c   d".split(/[,;\s]+/).filter(Boolean));
// [ 'a', 'b', 'c', 'd' ]

console.log(/^\d+$/.test("12345")); // true
console.log(/^\d+$/.test("123a5")); // false

console.log("too    many   spaces".replace(/\s+/g, " "));
// "too many spaces"

// --- Exercise 2 solution: extract hashtags ---
console.log("loving #javascript and #regex today".match(/#\w+/g));
// [ '#javascript', '#regex' ]

// --- Exercise 3 solution: HH:MM with named groups and constrained ranges ---
const timeRe = /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)$/;
console.log("14:30".match(timeRe)?.groups); // { hour: '14', minute: '30' }
console.log(timeRe.test("25:99"));           // false — 25 and 99 are out of range
