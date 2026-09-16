// Chapter 11 — Numbers and Math
// Run with: node examples/11-numbers-and-math.js

// 11.1 One number type
console.log("11.1", typeof 42, typeof 42.5, typeof NaN, typeof Infinity);

// 11.2 Floating point precision
console.log("11.2 0.1 + 0.2 =", 0.1 + 0.2);
console.log("11.2 equals 0.3?", 0.1 + 0.2 === 0.3);
function approximatelyEqual(a, b, epsilon = Number.EPSILON * 100) {
  return Math.abs(a - b) < epsilon;
}
console.log("11.2 approximatelyEqual:", approximatelyEqual(0.1 + 0.2, 0.3));

// 11.3 Integer safety limits
console.log("11.3 MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);
console.log("11.3 +1 (correct):", Number.MAX_SAFE_INTEGER + 1);
console.log("11.3 +2 (precision lost):", Number.MAX_SAFE_INTEGER + 2);
console.log("11.3 isSafeInteger:", Number.isSafeInteger(9007199254740991), Number.isSafeInteger(9007199254740992));

// 11.4 NaN
console.log("11.4 0/0:", 0 / 0);
console.log("11.4 NaN === NaN:", NaN === NaN);
console.log("11.4 Number.isNaN(NaN):", Number.isNaN(NaN));
console.log("11.4 global isNaN('hello') [misleading]:", isNaN("hello"));
console.log("11.4 Number.isNaN('hello') [correct]:", Number.isNaN("hello"));

// 11.5 Number methods
console.log("11.5 isInteger:", Number.isInteger(42), Number.isInteger(42.5));
console.log("11.5 isFinite:", Number.isFinite(42), Number.isFinite(Infinity));
console.log("11.5 toFixed:", (1234.5678).toFixed(2));
console.log("11.5 toFixed reveals imprecision:", (0.1).toFixed(20));
console.log("11.5 toPrecision:", (1234.5678).toPrecision(6));

// 11.6 Math object
console.log("11.6 round:", Math.round(4.5), Math.round(-4.5));
console.log("11.6 floor/ceil/trunc:", Math.floor(4.9), Math.ceil(4.1), Math.trunc(4.9), Math.trunc(-4.9));
console.log("11.6 abs/pow/sqrt/cbrt:", Math.abs(-7), Math.pow(2, 10), Math.sqrt(64), Math.cbrt(27));
console.log("11.6 min/max:", Math.min(4, 1, 9, -2), Math.max(4, 1, 9, -2));
console.log("11.6 min with spread:", Math.min(...[4, 1, 9, -2]));

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const rolls = Array.from({ length: 10 }, () => randomInt(1, 6));
console.log("11.6 10 dice rolls:", rolls);

// 11.7 BigInt
const huge = 9007199254740993n;
console.log("11.7 BigInt exact math:", huge + 10n);
console.log("11.7 typeof BigInt:", typeof huge);
console.log("11.7 mixing requires explicit conversion:", huge + BigInt(1));
console.log("11.7 converting down loses precision:", Number(huge) + 1);

// 11.8 Locale formatting
console.log("11.8 toLocaleString:", (1234567.891).toLocaleString());
console.log("11.8 currency:", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5));
console.log("11.8 german locale:", new Intl.NumberFormat("de-DE").format(1234567.891));
console.log("11.8 percent:", new Intl.NumberFormat("en-US", { style: "percent" }).format(0.756));

// Exercise 1: dice sum distribution
let sevens = 0;
for (let i = 0; i < 10000; i++) {
  if (randomInt(1, 6) + randomInt(1, 6) === 7) sevens++;
}
console.log("Exercise: sevens rolled out of 10000:", sevens);
