// Chapter 25 — JSON and Web Storage
// Run with: node examples/25-json-and-web-storage.js
// Note: localStorage/sessionStorage are browser-only APIs and are not
// covered here in runnable form — see the bottom of this file.

// --- 1. JSON.stringify basics ---
const user = { name: "Ada", born: 1815, active: true };
console.log(JSON.stringify(user));
// {"name":"Ada","born":1815,"active":true}

// --- 2. Pretty-printing with the `space` argument ---
console.log(JSON.stringify(user, null, 2));

// --- 3. Filtering keys with an array replacer ---
console.log(JSON.stringify(user, ["name", "active"]));
// {"name":"Ada","active":true}

// --- 4. Transforming/omitting values with a function replacer ---
console.log(
  JSON.stringify(user, (key, value) => (key === "born" ? undefined : value))
);
// {"name":"Ada","active":true}

// --- 5. What gets silently skipped or converted ---
console.log(
  JSON.stringify({ a: undefined, b: () => {}, c: NaN, d: [undefined, 1] })
);
// {"c":null,"d":[null,1]}

// --- 6. Dates serialize automatically via their built-in toJSON() ---
console.log(JSON.stringify({ createdAt: new Date("2024-01-01T00:00:00Z") }));
// {"createdAt":"2024-01-01T00:00:00.000Z"}

// --- 7. Custom toJSON on your own class ---
class Money {
  constructor(cents) {
    this.cents = cents;
  }
  toJSON() {
    return `$${(this.cents / 100).toFixed(2)}`;
  }
}
console.log(JSON.stringify({ price: new Money(1999) }));
// {"price":"$19.99"}

// --- 8. Circular references throw ---
const circular = { name: "oops" };
circular.self = circular;
try {
  JSON.stringify(circular);
} catch (err) {
  console.log("Caught expected error:", err.constructor.name, "-", err.message);
}

// --- 9. JSON.parse basics + reviving dates ---
const text = '{"name":"Ada","createdAt":"2024-01-01T00:00:00.000Z"}';
const revived = JSON.parse(text, (key, value) =>
  key === "createdAt" ? new Date(value) : value
);
console.log(revived.name, revived.createdAt instanceof Date, revived.createdAt.getFullYear());
// Ada true 2024

// --- 10. Safe parsing of untrusted/malformed input ---
function safeParse(input, fallback = null) {
  try {
    return JSON.parse(input);
  } catch (err) {
    console.error("Invalid JSON:", err.message);
    return fallback;
  }
}
console.log(safeParse("{not valid json}", {})); // logs error, then {}

// --- 11. Deep clone via JSON (and its limits) ---
const original = { a: 1, nested: { b: 2 }, when: new Date(), skip: undefined };
const clone = JSON.parse(JSON.stringify(original));
console.log(clone);
// { a: 1, nested: { b: 2 }, when: '...ISO string, NOT a Date instance...' }
console.log("clone.when is a Date?", clone.when instanceof Date); // false
console.log("'skip' survived cloning?", "skip" in clone);          // false

// structuredClone (Node 17+, modern browsers) handles Dates/Maps/Sets
// correctly and does not need JSON at all:
const betterClone = structuredClone(original);
console.log("structuredClone preserves Date?", betterClone.when instanceof Date); // true

/*
Browser-only: localStorage / sessionStorage
--------------------------------------------
Open any web page's DevTools console and try:

  localStorage.setItem("prefs", JSON.stringify({ theme: "dark", fontSize: 14 }));
  const stored = JSON.parse(localStorage.getItem("prefs"));
  console.log(stored.theme); // "dark"

  sessionStorage.setItem("draft", JSON.stringify({ step: 2 }));
  console.log(JSON.parse(sessionStorage.getItem("draft")));

  localStorage.removeItem("prefs");
  localStorage.clear();

These APIs throw a ReferenceError in plain Node.js because `localStorage`
is a browser global, not part of the JavaScript language or Node's runtime.
*/
