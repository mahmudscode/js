// Chapter 32 — Testing JavaScript
// Run with: node --test examples/32-testing-javascript/
//
// Uses Node.js's built-in test runner and assertion library —
// no npm install required.

import test, { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sum, clamp, isPalindrome } from "./sum.js";

test("sum adds two positive numbers", () => {
  assert.strictEqual(sum(2, 3), 5);
});

test("sum handles negative numbers", () => {
  assert.strictEqual(sum(-1, -1), -2);
});

test("clamp restricts a value to a range", () => {
  assert.strictEqual(clamp(15, 0, 10), 10);
  assert.strictEqual(clamp(-5, 0, 10), 0);
  assert.strictEqual(clamp(5, 0, 10), 5);
});

test("isPalindrome recognizes palindromes, ignoring case and punctuation", () => {
  assert.strictEqual(isPalindrome("racecar"), true);
  assert.strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true);
  assert.strictEqual(isPalindrome("hello"), false);
});

// Grouped tests with shared setup, demonstrating describe/it/beforeEach —
// the same conceptual building blocks Jest and Mocha use.
describe("a counter (demonstrates beforeEach)", () => {
  let count;

  beforeEach(() => {
    count = 0; // fresh state before every test in this block
  });

  it("starts at zero", () => {
    assert.strictEqual(count, 0);
  });

  it("increments independently of other tests", () => {
    count += 1;
    assert.strictEqual(count, 1);
  });
});
