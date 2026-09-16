// Chapter 14 — Scope and Closures
// Run with: node examples/14-scope-and-closures.js

// --- 14.1 Scope kinds ---
var globalVar = "I'm global";

function outer() {
  var functionScoped = "I'm function-scoped";

  if (true) {
    let blockScoped = "I'm block-scoped";
    var stillFunctionScoped = "var ignores the if-block";
    console.log(blockScoped);
  }

  console.log(functionScoped);
  console.log(stillFunctionScoped);
  try {
    // blockScoped is not defined here at all (ReferenceError, not "undefined")
    // eslint-disable-next-line no-undef
    console.log(blockScoped);
  } catch (e) {
    console.log("blockScoped outside its block ->", e.constructor.name);
  }
}
outer();

// --- 14.2 Scope chain ---
const a = "global a";
function scopeChainOuter() {
  const b = "outer b";
  function inner() {
    const c = "inner c";
    console.log(a, b, c);
  }
  inner();
}
scopeChainOuter();

// --- 14.3 Hoisting ---
console.log("hoisted var:", hoistedVar); // undefined
var hoistedVar = 5;

sayHi(); // works before its declaration
function sayHi() {
  console.log("Hi from a hoisted function declaration!");
}

try {
  console.log(hoistedLet);
} catch (e) {
  console.log("TDZ error:", e.constructor.name, "-", e.message);
}
let hoistedLet = 5;

try {
  sayBye();
} catch (e) {
  console.log("var function expression before assignment ->", e.constructor.name);
}
var sayBye = function () {
  console.log("Bye!");
};

// --- 14.4 Closures ---
function makeCounter() {
  let count = 0;
  return function increment() {
    count++;
    return count;
  };
}
const counter1 = makeCounter();
const counter2 = makeCounter();
console.log(counter1(), counter1(), counter1(), counter2()); // 1 2 3 1

function createBankAccount(initialBalance) {
  let balance = initialBalance;
  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}
const account = createBankAccount(100);
console.log("balance:", account.getBalance());
account.deposit(50);
console.log("balance after deposit:", account.getBalance());
console.log("direct access to private balance:", account.balance);

function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log("cache hit for", key);
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
function square(n) {
  return n * n;
}
const fastSquare = memoize(square);
console.log(fastSquare(5));
console.log(fastSquare(5)); // logs "cache hit"

// --- 14.5 The classic var/let + setTimeout bug ---
console.log("--- var loop (all print 3) ---");
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log("var i:", i);
  }, 50);
}

console.log("--- let loop (prints 0,1,2) ---");
for (let j = 0; j < 3; j++) {
  setTimeout(function () {
    console.log("let j:", j);
  }, 100);
}

console.log("--- IIFE fix for var (prints 0,1,2) ---");
for (var k = 0; k < 3; k++) {
  (function (capturedK) {
    setTimeout(function () {
      console.log("IIFE k:", capturedK);
    }, 150);
  })(k);
}

// --- 14.6 Shared closures ---
function createToggle() {
  let isOn = false;
  return {
    toggle() {
      isOn = !isOn;
      return isOn;
    },
    status() {
      return isOn ? "ON" : "OFF";
    },
  };
}
const light = createToggle();
console.log("light status:", light.status());
light.toggle();
console.log("light status after toggle:", light.status());
