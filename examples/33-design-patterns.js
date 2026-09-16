// Chapter 33 — Design Patterns
// Run with: node examples/33-design-patterns.js

// --- 1. Module pattern (closures hiding private state) -----------------
const counterModule = (function () {
  let count = 0;

  function increment() {
    count += 1;
    return count;
  }

  function reset() {
    count = 0;
  }

  return { increment, reset };
})();

console.log("--- Module pattern ---");
console.log(counterModule.increment()); // 1
console.log(counterModule.increment()); // 2
console.log("count is private:", counterModule.count); // undefined

// --- 2. Singleton ---------------------------------------------------
class Logger {
  static #instance;

  constructor() {
    if (Logger.#instance) {
      return Logger.#instance;
    }
    this.logs = [];
    Logger.#instance = this;
  }

  log(message) {
    this.logs.push(message);
    console.log(`[LOG] ${message}`);
  }
}

console.log("\n--- Singleton ---");
const loggerA = new Logger();
const loggerB = new Logger();
loggerA.log("first message");
loggerB.log("second message");
console.log("Same instance?", loggerA === loggerB); // true
console.log("Shared log history:", loggerA.logs);

// --- 3. Factory ---------------------------------------------------
function createUser(type, name) {
  const base = { name, createdAt: new Date().toISOString().slice(0, 10) };

  switch (type) {
    case "admin":
      return { ...base, role: "admin", permissions: ["read", "write", "delete"] };
    case "editor":
      return { ...base, role: "editor", permissions: ["read", "write"] };
    default:
      return { ...base, role: "viewer", permissions: ["read"] };
  }
}

console.log("\n--- Factory ---");
console.log(createUser("admin", "Alice"));
console.log(createUser("viewer", "Bob"));

// --- 4. Observer ---------------------------------------------------
class Subject {
  #observers = [];

  subscribe(observerFn) {
    this.#observers.push(observerFn);
    return () => {
      this.#observers = this.#observers.filter((fn) => fn !== observerFn);
    };
  }

  notify(data) {
    for (const observerFn of this.#observers) {
      observerFn(data);
    }
  }
}

console.log("\n--- Observer ---");
const priceFeed = new Subject();
const unsubscribe = priceFeed.subscribe((price) => {
  console.log(`Price updated: $${price}`);
});
priceFeed.notify(42.5);
unsubscribe();
priceFeed.notify(43.0); // no listener left — nothing prints

// --- 5. Decorator ---------------------------------------------------
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

console.log("\n--- Decorator ---");
const loggedAdd = withLogging(add);
loggedAdd(2, 3);

// --- 6. Strategy ---------------------------------------------------
const shippingOptions = [
  { name: "Standard", price: 5, etaMinutes: 4320, co2Grams: 800 },
  { name: "Express", price: 15, etaMinutes: 120, co2Grams: 2000 },
  { name: "Bike Courier", price: 8, etaMinutes: 90, co2Grams: 50 },
];

const strategies = {
  cheapest: (options) => [...options].sort((a, b) => a.price - b.price)[0],
  fastest: (options) => [...options].sort((a, b) => a.etaMinutes - b.etaMinutes)[0],
  greenest: (options) => [...options].sort((a, b) => a.co2Grams - b.co2Grams)[0],
};

function chooseShippingOption(options, strategyName) {
  const strategy = strategies[strategyName] ?? strategies.cheapest;
  return strategy(options);
}

console.log("\n--- Strategy ---");
console.log("Cheapest:", chooseShippingOption(shippingOptions, "cheapest").name);
console.log("Fastest:", chooseShippingOption(shippingOptions, "fastest").name);
console.log("Greenest:", chooseShippingOption(shippingOptions, "greenest").name);
