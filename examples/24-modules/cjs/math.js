// CommonJS module — exports via module.exports
// Run the consumer: node examples/24-modules/cjs/main.js

function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
