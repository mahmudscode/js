// Chapter 13 — Destructuring, Spread & Rest
// Run with: node examples/13-destructuring-spread-rest.js

// 13.1 Array destructuring
const point = [10, 20, 30];
const [x, y, z] = point;
console.log("13.1 basic:", x, y, z);

const [first, , third] = point;
console.log("13.1 skip:", first, third);

const [a = 1, b = 2, c = 3, d = 4] = [10, 20];
console.log("13.1 defaults:", a, b, c, d);

let p = 1, q = 2;
[p, q] = [q, p];
console.log("13.1 swap:", p, q);

const [head, ...tail] = [1, 2, 3, 4, 5];
console.log("13.1 rest:", head, tail);

const [c1, c2, c3] = "abc";
console.log("13.1 destructure string:", c1, c2, c3);

const [firstEntry] = new Map([["k1", "v1"], ["k2", "v2"]]);
console.log("13.1 destructure Map:", firstEntry);

// 13.2 Object destructuring
const user = { name: "Ada", age: 36, city: "London" };
const { name, age } = user;
console.log("13.2 basic:", name, age);

const { name: fullName, age: years } = user;
console.log("13.2 rename:", fullName, years);

const { name: n = "Anonymous", country = "Unknown" } = user;
console.log("13.2 defaults:", n, country);

const response = { data: { user: { id: 1, profile: { bio: "Engineer" } } } };
const { data: { user: { profile: { bio } } } } = response;
console.log("13.2 nested:", bio);

const { name: userName, ...rest } = user;
console.log("13.2 object rest:", userName, rest);

// 13.3 Destructuring in function params
function createUser({ name, age, isAdmin = false, country = "Unknown" }) {
  return { name, age, isAdmin, country };
}
console.log("13.3:", createUser({ age: 36, name: "Ada", country: "UK" }));

const entryStrings = Object.entries({ a: 1, b: 2 }).map(([key, value]) => `${key}=${value}`);
console.log("13.3 array destructure in map:", entryStrings);

// 13.4 Spread
const arrA = [1, 2, 3];
const arrB = [4, 5, 6];
console.log("13.4 array spread combine:", [...arrA, ...arrB]);
console.log("13.4 array spread with extras:", [0, ...arrA, 3.5, ...arrB]);
console.log("13.4 spread string:", [..."hello"]);
console.log("13.4 spread into Math.max:", Math.max(...arrA));

const defaults = { theme: "light", fontSize: 14 };
const overrides = { fontSize: 18 };
console.log("13.4 object spread merge:", { ...defaults, ...overrides });

function sum3(x1, x2, x3) { return x1 + x2 + x3; }
console.log("13.4 spread into function call:", sum3(...arrA));

// 13.5 Rest parameters
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}
console.log("13.5 rest params sum:", sum(1, 2, 3, 4));

function logFirstThenRest(firstArg, ...others) {
  console.log("13.5 first/others:", firstArg, others);
}
logFirstThenRest(1, 2, 3, 4);

// 13.6 Combining patterns
function updateUser(u, changes) {
  return { ...u, ...changes };
}
const original = { id: 1, name: "Ada", age: 36 };
const updated = updateUser(original, { age: 37 });
console.log("13.6 clone-with-override:", original, updated);

function toPublicProfile({ password, ssn, ...publicFields }) {
  return publicFields;
}
console.log("13.6 redact fields:", toPublicProfile({ id: 1, name: "Ada", password: "secret", ssn: "123-45-6789" }));

function withDefaults(userConfig = {}) {
  const cfgDefaults = { retries: 3, timeout: 5000, headers: { accept: "json" } };
  return { ...cfgDefaults, ...userConfig, headers: { ...cfgDefaults.headers, ...userConfig.headers } };
}
console.log("13.6 nested merge:", withDefaults({ timeout: 1000, headers: { auth: "token" } }));

// Exercise 2
function omit(obj, keysToRemove) {
  const keySet = new Set(keysToRemove);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keySet.has(k)));
}
console.log("Exercise omit:", omit({ a: 1, b: 2, c: 3 }, ["b"]));
