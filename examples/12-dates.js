// Chapter 12 — Dates and Time
// Run with: node examples/12-dates.js

// 12.1 Basics
const now = new Date();
console.log("12.1 now:", now.toISOString());
console.log("12.1 getTime:", now.getTime());
console.log("12.1 Date.now():", Date.now());

// 12.2 Construction forms
console.log("12.2 from epoch ms:", new Date(1789554600000).toISOString());
console.log("12.2 date-only ISO (UTC midnight):", new Date("2026-09-16").toISOString());
console.log("12.2 y/m/d ctor (month 8 = Sept):", new Date(2026, 8, 16).toDateString());

// 12.3 Getting/setting components
const d = new Date(2026, 8, 16, 14, 30, 45);
console.log("12.3 components:", {
  year: d.getFullYear(),
  month: d.getMonth(),
  date: d.getDate(),
  day: d.getDay(),
  hours: d.getHours(),
  minutes: d.getMinutes(),
  seconds: d.getSeconds(),
});
const d2 = new Date(d);
d2.setFullYear(2027);
d2.setMonth(0);
d2.setDate(1);
console.log("12.3 after setters:", d2.toDateString());

// 12.4 Date arithmetic
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
const today = new Date(2026, 8, 30);
console.log("12.4 Sept 30 + 5 days rolls to Oct:", addDays(today, 5).toDateString());

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}
console.log("12.4 days in 2026:", daysBetween(new Date(2026, 0, 1), new Date(2026, 11, 31)));

// 12.5 Formatting
console.log("12.5 toISOString:", d.toISOString());
console.log("12.5 toDateString:", d.toDateString());
console.log("12.5 toLocaleDateString:", d.toLocaleDateString());
console.log("12.5 Intl long format:", new Intl.DateTimeFormat("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
}).format(d));
console.log("12.5 Intl fr-FR full:", new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(d));

// Exercise 1: leap year check via Date auto-normalization
function isLeapYear(year) {
  const test = new Date(year, 1, 29);
  return test.getMonth() === 1; // still February -> Feb 29 existed
}
console.log("Exercise isLeapYear(2024):", isLeapYear(2024));
console.log("Exercise isLeapYear(2026):", isLeapYear(2026));
console.log("Exercise isLeapYear(2000):", isLeapYear(2000));
console.log("Exercise isLeapYear(1900):", isLeapYear(1900));
