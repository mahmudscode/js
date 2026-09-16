// ES Module — named exports, resolved statically at parse time
// Run the consumer: node examples/24-modules/esm/main.mjs

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const PI = 3.14159;

// import.meta gives metadata about this module — there is no __filename
// or __dirname in ESM, import.meta.url replaces them.
console.log("math.mjs loaded from:", import.meta.url);
