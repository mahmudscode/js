// Chapter 19 — Higher-Order Functions & Functional Programming
// Run with: node examples/19-higher-order-functions.js

// 1. Functions as first-class values
const square = function (x) {
  return x * x;
};
const operations = { double: (x) => x * 2, square };
const functionList = [square, operations.double];
console.log(operations.square(5)); // 25
console.log(functionList[1](5));   // 10

// 2. Higher-order functions
function withLogging(fn) {
  return function (...args) {
    console.log(`Calling ${fn.name} with`, args);
    const result = fn(...args);
    console.log(`${fn.name} returned`, result);
    return result;
  };
}
function add(a, b) {
  return a + b;
}
const loggedAdd = withLogging(add);
loggedAdd(2, 3);

// 3. map/filter/reduce, imperative vs declarative
const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
const evensImperative = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) evensImperative.push(numbers[i]);
}
const evensDeclarative = numbers.filter((n) => n % 2 === 0);
console.log(evensImperative, evensDeclarative);

const sumOfSquaresOfEvens = numbers
  .filter((n) => n % 2 === 0)
  .map((n) => n * n)
  .reduce((total, n) => total + n, 0);
console.log("sumOfSquaresOfEvens:", sumOfSquaresOfEvens);

function myMap(array, fn) {
  return array.reduce((acc, item) => {
    acc.push(fn(item));
    return acc;
  }, []);
}
function myFilter(array, predicate) {
  return array.reduce((acc, item) => {
    if (predicate(item)) acc.push(item);
    return acc;
  }, []);
}
console.log("myMap:", myMap([1, 2, 3], (n) => n * 10));
console.log("myFilter:", myFilter([1, 2, 3, 4], (n) => n > 2));

// 4. Composition
const compose = (...fns) => (initialValue) => fns.reduceRight((value, fn) => fn(value), initialValue);
const pipe = (...fns) => (initialValue) => fns.reduce((value, fn) => fn(value), initialValue);

const trim = (s) => s.trim();
const toLowerCase = (s) => s.toLowerCase();
const removeSpaces = (s) => s.replace(/\s+/g, "-");

const slugify = pipe(trim, toLowerCase, removeSpaces);
console.log("slugify (pipe):", slugify("  Hello World  "));

const slugifyComposed = compose(removeSpaces, toLowerCase, trim);
console.log("slugify (compose):", slugifyComposed("  Hello World  "));

// 5. Currying and partial application
function add3(a, b, c) {
  return a + b + c;
}
const curriedAdd3Arrow = (a) => (b) => (c) => a + b + c;
console.log("curriedAdd3Arrow(1)(2)(3):", curriedAdd3Arrow(1)(2)(3));

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}
const curriedAdd = curry(add3);
console.log("curriedAdd(1)(2)(3):", curriedAdd(1)(2)(3));
console.log("curriedAdd(1, 2)(3):", curriedAdd(1, 2)(3));
console.log("curriedAdd(1, 2, 3):", curriedAdd(1, 2, 3));

const multiply = (a, b) => a * b;
const curriedMultiply = curry(multiply);
const double = curriedMultiply(2);
const triple = curriedMultiply(3);
console.log("double(5), triple(5):", double(5), triple(5));

// 6. Pure functions and immutability
let taxRate = 0.08;
function addTaxImpure(cart) {
  cart.total = cart.total * (1 + taxRate);
  return cart.total;
}
function addTaxPure(total, rate) {
  return total * (1 + rate);
}
const cart = { total: 100 };
console.log("addTaxPure:", addTaxPure(cart.total, 0.08));
console.log("cart.total unchanged:", cart.total);

function addItemImmutable(cartObj, item) {
  return { ...cartObj, items: [...cartObj.items, item] };
}
const cartA = { items: ["apple"] };
const cartB = addItemImmutable(cartA, "banana");
console.log("cartA.items unchanged:", cartA.items);
console.log("cartB.items new:", cartB.items);

// 7. Imperative vs functional style
const users = [
  { name: "Ada", active: true },
  { name: "Grace", active: false },
  { name: "Alan", active: true },
];
const activeNamesImperative = [];
for (const user of users) {
  if (user.active) activeNamesImperative.push(user.name);
}
const activeNamesFunctional = users.filter((u) => u.active).map((u) => u.name);
console.log("imperative:", activeNamesImperative);
console.log("functional:", activeNamesFunctional);

// --- Exercises ---

// Exercise 1: myReduce from scratch
function myReduce(array, fn, initialValue) {
  let acc = initialValue;
  let startIndex = 0;
  if (acc === undefined) {
    acc = array[0];
    startIndex = 1;
  }
  for (let i = startIndex; i < array.length; i++) {
    acc = fn(acc, array[i], i, array);
  }
  return acc;
}
console.log("Exercise 1 -> myReduce sum:", myReduce([1, 2, 3, 4], (a, b) => a + b, 0));

// Exercise 2: curried between()
const between = (min) => (max) => (value) => value >= min && value <= max;
console.log("Exercise 2 -> between(1)(10)(5):", between(1)(10)(5));
console.log("Exercise 2 -> between(1)(10)(15):", between(1)(10)(15));

function betweenUncurried(min, max, value) {
  return value >= min && value <= max;
}
const curriedBetween = curry(betweenUncurried);
console.log("Exercise 2 -> curried(betweenUncurried)(1)(10)(5):", curriedBetween(1)(10)(5));

// Exercise 3: addTaxImpure gives different results across test runs because
// it depends on and mutates the module-level `taxRate` and mutates its
// argument -- if taxRate changes between calls, or the same cart object is
// reused, results differ for identical-looking calls. Pure fix: addTaxPure.
console.log("Exercise 3 -> addTaxPure is deterministic:", addTaxPure(100, 0.08) === addTaxPure(100, 0.08));
