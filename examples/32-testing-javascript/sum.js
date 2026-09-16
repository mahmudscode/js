// Chapter 32 — Testing JavaScript
// The small module under test. See sum.test.js in this folder.

export function sum(a, b) {
  return a + b;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function isPalindrome(str) {
  const normalized = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === [...normalized].reverse().join("");
}
