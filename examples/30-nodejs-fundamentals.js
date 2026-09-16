// Chapter 30 — Node.js Fundamentals
// Run with: node examples/30-nodejs-fundamentals.js
//
// Uses only Node.js built-in modules — no npm install required.

import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import http from "node:http";
import { EventEmitter } from "node:events";
import os from "node:os";

// --- 1. process ------------------------------------------------------
console.log("Platform:", process.platform);
console.log("Node version:", process.version);
console.log("Script args (after the file path):", process.argv.slice(2));
console.log("HOME dir via env:", process.env.HOME ?? "(not set)");
console.log("CPU count via os module:", os.cpus().length);

// --- 2. fs: write then read a temp file, then clean up ----------------
const tmpFile = path.join(os.tmpdir(), "js-book-ch30-demo.txt");

writeFileSync(tmpFile, "Hello from Node.js fs module!\n", "utf8");
const contents = readFileSync(tmpFile, "utf8");
console.log("File contents:", contents.trim());
unlinkSync(tmpFile); // clean up so re-running this file stays idempotent

// --- 3. path ------------------------------------------------------
const examplePath = "/home/user/documents/report.pdf";
console.log("basename:", path.basename(examplePath)); // report.pdf
console.log("extname:", path.extname(examplePath));   // .pdf
console.log("dirname:", path.dirname(examplePath));   // /home/user/documents
console.log("joined:", path.join("data", "users", "42.json"));

// --- 4. EventEmitter ------------------------------------------------
class OrderSystem extends EventEmitter {
  placeOrder(item) {
    console.log(`Order placed: ${item}`);
    this.emit("order:placed", { item, timestamp: Date.now() });
  }
}

const orders = new OrderSystem();
orders.on("order:placed", (order) => {
  console.log(`[email] Sending confirmation for ${order.item}`);
});
orders.on("order:placed", (order) => {
  console.log(`[inventory] Decrementing stock for ${order.item}`);
});
orders.placeOrder("Wireless Mouse");

// --- 5. Minimal HTTP server (start, hit it once, then close) ----------
const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello from a raw Node.js server!\n");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  }
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  console.log(`Server listening on http://127.0.0.1:${port}`);

  // Make one real request to prove it works, then shut the server down
  // so this script exits cleanly instead of hanging forever.
  http.get(`http://127.0.0.1:${port}/`, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Server responded:", body.trim());
      server.close(() => console.log("Server closed. Demo complete."));
    });
  });
});
