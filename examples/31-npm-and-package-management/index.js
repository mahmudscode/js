// Chapter 31 — npm and Package Management
// This is the script referenced by the "start" script in package.json:
//   npm start          (from inside this folder)
//   node index.js       (equivalent, run directly)
//
// Deliberately dependency-free — it only imports Node.js built-ins, even
// though the package.json in this folder lists example third-party
// dependencies purely to illustrate the file format (see README.md).

console.log("Running js-book-ch31-example (no external dependencies).");
console.log("This script exists to show what package.json's \"main\"/\"start\" fields point to.");
console.log("Node.js version:", process.version);
