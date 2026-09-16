// Chapter 10 — Strings
// Run with: node examples/10-strings.js

// 10.1 Immutability
let greeting = "hello";
greeting[0] = "H"; // silently does nothing
console.log("10.1 unchanged:", greeting);
greeting = greeting.toUpperCase();
console.log("10.1 reassigned:", greeting);

// 10.2 Template literals
const name = "Wole";
const age = 30;
console.log("10.2 interpolation:", `${name} is ${age} years old, born in ${2026 - age}.`);

const message = `Dear customer,

Thank you for your order.
Regards,
The Team`;
console.log("10.2 multi-line:\n" + message);

function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] !== undefined ? `**${values[i]}**` : "";
    return result + str + value;
  }, "");
}
const item = "laptop", price = 999;
console.log("10.2 tagged template:", highlight`The ${item} costs ${price} dollars.`);

// 10.3 Common methods
const s = "  Hello, World!  ";
console.log("10.3 trim:", JSON.stringify(s.trim()));

const text = "Hello, World!";
console.log("10.3 slice:", text.slice(7, 12));
console.log("10.3 slice negative:", text.slice(-6));
console.log("10.3 split:", text.split(", "));
console.log("10.3 replace:", text.replace("World", "JS"));
console.log("10.3 replaceAll:", text.replaceAll("l", "L"));
console.log("10.3 includes/startsWith/endsWith:", text.includes("World"), text.startsWith("Hello"), text.endsWith("!"));
console.log("10.3 padStart/padEnd:", text.padStart(15, "*"), text.padEnd(15, "*"));
console.log("10.3 repeat:", "ab".repeat(3));
console.log("10.3 regex replace with groups:", "2026-09-16".replace(/(\d+)-(\d+)-(\d+)/, "$3/$2/$1"));

// 10.4 String <-> number conversions
console.log("10.4 Number('42'):", Number("42"));
console.log("10.4 Number('42px'):", Number("42px"));
console.log("10.4 Number(''):", Number(""));
console.log("10.4 Number('  42  '):", Number("  42  "));
console.log("10.4 Number(null):", Number(null));
console.log("10.4 Number(undefined):", Number(undefined));
console.log("10.4 parseInt('42px'):", parseInt("42px"));
console.log("10.4 parseInt('px42'):", parseInt("px42"));
console.log("10.4 parseInt('3.99'):", parseInt("3.99"));
console.log("10.4 parseFloat('3.99abc'):", parseFloat("3.99abc"));
console.log("10.4 unary plus '42':", +"42");
console.log("10.4 (42).toString(2):", (42).toString(2));
console.log("10.4 (255).toString(16):", (255).toString(16));

// 10.5 Unicode
console.log("10.5 'hello'.length:", "hello".length);
console.log("10.5 emoji length (UTF-16 units):", "😀".length);
const smiley = "😀";
console.log("10.5 spread length (code points):", [...smiley].length);
console.log("10.5 Array.from length:", Array.from(smiley).length);
console.log("10.5 broken index access:", smiley[0]);
console.log("10.5 correct spread access:", [...smiley][0]);

// 10.6 Comparing strings
console.log("10.6 'apple' < 'banana':", "apple" < "banana");
console.log("10.6 'Apple' < 'apple':", "Apple" < "apple");
console.log("10.6 naive sort:", ["Banana", "apple", "Cherry"].sort());
console.log("10.6 localeCompare sort:", ["Banana", "apple", "Cherry"].sort((a, b) => a.localeCompare(b)));
