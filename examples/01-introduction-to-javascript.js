// Chapter 1 — Introduction to JavaScript
// Run with: node examples/01-introduction-to-javascript.js

// 1. JavaScript is dynamically typed — the same variable can hold
//    different types of values over its lifetime.
let x = 42;
console.log(typeof x, x); // number 42

x = "hello";
console.log(typeof x, x); // string hello

x = [1, 2, 3];
console.log(typeof x, x); // object [ 1, 2, 3 ]

// 2. Weak typing means JavaScript coerces types automatically in many
//    operators. The `+` operator prefers string concatenation if either
//    side is a string; `-`, `*`, `/` prefer numeric conversion.
console.log("5" + 3);   // "53"
console.log("5" - 3);   // 2
console.log("5" * "2"); // 10
console.log(1 + true);  // 2  (true -> 1)
console.log(1 + false); // 1  (false -> 0)

// 3. Loose (==) vs strict (===) equality.
console.log(0 == "0");   // true  -> "0" coerced to 0
console.log(0 === "0");  // false -> different types, no coercion
console.log(null == undefined);  // true (special case)
console.log(null === undefined); // false

// 4. Environment differences: this file runs in Node.js, so browser-only
// globals like `window` and `document` do not exist here.
console.log(typeof process);   // "object" -> Node.js global
console.log(typeof window);    // "undefined" -> browser-only global
console.log(typeof document);  // "undefined" -> browser-only global

// 5. Engine version check — useful when debugging "why doesn't this
// feature work" issues caused by an outdated runtime.
console.log("Node.js version:", process.version);

// Exercise 2 answers:
console.log('"10" - "4" + "2" =', "10" - "4" + "2"); // 6 + "2" -> "62"
console.log('"10" + "4" - "2" =', "10" + "4" - "2"); // "104" - "2" -> 102
