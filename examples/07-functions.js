// Chapter 7 — Functions
// Run with: node examples/07-functions.js

// 1. Three ways to declare a function
function add(a, b) {
  return a + b;
}
const subtract = function (a, b) {
  return a - b;
};
const divide = (a, b) => a / b;
console.log("add:", add(2, 3), "subtract:", subtract(5, 2), "divide:", divide(10, 2));

// 2. Missing/extra arguments
function greet(name) {
  return `Hello, ${name}`;
}
console.log(greet());
console.log(greet("Alice", "Bob"));

// 3. Default parameters (undefined triggers default, null does not)
function greetWithDefault(name = "Guest") {
  return `Hello, ${name}`;
}
console.log(greetWithDefault());
console.log(greetWithDefault(undefined));
console.log(greetWithDefault(null));
console.log(greetWithDefault("Bob"));

function makeRange(start, end = start + 10) {
  return [start, end];
}
console.log("makeRange(5):", makeRange(5));

// 4. Rest parameters
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
console.log("sum(1,2,3):", sum(1, 2, 3), "sum():", sum());

function logFirstAndRest(first, ...rest) {
  console.log("first:", first, "rest:", rest);
}
logFirstAndRest(1, 2, 3, 4);

// 5. arguments object (array-like, not a real array)
function showArgs() {
  console.log("arguments.length:", arguments.length, "arguments[0]:", arguments[0]);
  const realArray = Array.from(arguments);
  return realArray.map((x) => x * 2);
}
console.log("showArgs(1,2,3):", showArgs(1, 2, 3));

// 6. Arrow functions inherit `this`
const obj = {
  name: "Timer",
  startRegular: function () {
    setTimeout(function () {
      console.log("regular function this?.name:", this?.name);
    }, 0);
  },
  startArrow: function () {
    setTimeout(() => {
      console.log("arrow function this.name:", this.name);
    }, 0);
  },
};
obj.startRegular();
obj.startArrow();

// 7. Arrow function syntax shortcuts
const square = (x) => x * x;
const makeObj = () => ({ key: "value" });
console.log("square(4):", square(4), "makeObj():", makeObj());

// 8. Function hoisting
console.log("hoisted():", hoisted());
function hoisted() {
  return "I work!";
}

// 9. IIFE / module pattern
const counter = (function () {
  let count = 0;
  return {
    increment: () => ++count,
    reset: () => (count = 0),
  };
})();
console.log("counter.increment():", counter.increment());
console.log("counter.increment():", counter.increment());
console.log("counter.reset():", counter.reset());

// 10. First-class functions
function processArray(arr, callback) {
  const result = [];
  for (const item of arr) result.push(callback(item));
  return result;
}
console.log("processArray:", processArray([1, 2, 3], (x) => x * 10));

function makeMultiplier(factor) {
  return function (x) {
    return x * factor;
  };
}
const triple = makeMultiplier(3);
console.log("triple(7):", triple(7));

// 11. Pure vs impure functions
function addItemImpure(cart, item) {
  cart.push(item);
  return cart;
}
function addItemPure(cart, item) {
  return [...cart, item];
}
const originalCart = ["apple"];
const pureResult = addItemPure(originalCart, "banana");
console.log("pure: original untouched:", originalCart, "new array:", pureResult);

// 12. Recursion
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
console.log("factorial(5):", factorial(5));

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log("fibonacci(10):", fibonacci(10));

function sumNestedArray(arr) {
  let total = 0;
  for (const item of arr) {
    total += Array.isArray(item) ? sumNestedArray(item) : item;
  }
  return total;
}
console.log("sumNestedArray:", sumNestedArray([1, [2, 3], [4, [5, 6]]]));

// --- Exercises ---

// Exercise 1: makeAdder
function makeAdder(x) {
  return (y) => x + y;
}
console.log("Exercise 1 -> makeAdder(5)(3):", makeAdder(5)(3));

// Exercise 2: converting to arrow changes `this` binding behavior — an
// arrow version of sayName would NOT work as an object method, because
// arrows have no own `this` and would inherit `this` from the enclosing
// (likely module/global) scope instead of the object it's attached to.
const sayNameRegular = { name: "Alice", say: function () { return this.name; } };
const sayNameArrow = { name: "Alice", say: () => this?.name };
console.log("Exercise 2 -> regular method this.name:", sayNameRegular.say());
console.log("Exercise 2 -> arrow method this.name (broken):", sayNameArrow.say());

// Exercise 3: flattenDeep
function flattenDeep(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep(item));
    } else {
      result.push(item);
    }
  }
  return result;
}
console.log("Exercise 3 -> flattenDeep:", flattenDeep([1, [2, 3], [4, [5, 6]]]));
