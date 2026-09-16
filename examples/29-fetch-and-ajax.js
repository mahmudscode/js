// Chapter 29 — Fetch, AJAX, and HTTP
// Run with: node examples/29-fetch-and-ajax.js
//
// This file spins up its own tiny local HTTP server using Node's built-in
// `http` module, then uses Node's built-in `fetch` (Node 18+) to make real
// GET and POST requests against it. No external network access and no
// dependencies required.

import http from "node:http";

// --- A minimal server with a few routes ---
const users = [
  { id: 1, name: "Ada Lovelace" },
  { id: 2, name: "Grace Hopper" },
];

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
    return;
  }

  if (req.method === "POST" && req.url === "/users") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const newUser = JSON.parse(body);
    newUser.id = users.length + 1;
    users.push(newUser);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(newUser));
    return;
  }

  if (req.method === "GET" && req.url === "/slow") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("This took 2 seconds");
    return;
  }

  // Anything else: 404 — used to demonstrate the response.ok gotcha
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const base = `http://localhost:${port}`;
console.log(`Local test server running at ${base}\n`);

// --- 1. Basic GET request ---
const getRes = await fetch(`${base}/users`);
console.log("GET /users ->", getRes.status, getRes.ok);
console.log(await getRes.json());

// --- 2. POST request with a JSON body ---
const postRes = await fetch(`${base}/users`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Margaret Hamilton" }),
});
console.log("\nPOST /users ->", postRes.status, postRes.ok);
console.log(await postRes.json());

// --- 3. The response.ok gotcha: fetch does NOT reject on 404 ---
const missingRes = await fetch(`${base}/does-not-exist`);
console.log("\nGET /does-not-exist ->", missingRes.status, "ok:", missingRes.ok);
// fetch resolved successfully even though this is an error response —
// you MUST check response.ok (or response.status) yourself.
if (!missingRes.ok) {
  console.log("Handled as an application-level error, not a thrown exception.");
}

// --- 4. A helper that throws for non-2xx responses, for use with try/catch ---
async function getJsonOrThrow(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

try {
  await getJsonOrThrow(`${base}/does-not-exist`);
} catch (err) {
  console.log("\nCaught expected error:", err.message);
}

// --- 5. AbortController for cancellation / timeouts ---
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

try {
  console.log("\nFetching /slow with a 300ms timeout (server takes 2000ms)...");
  await fetchWithTimeout(`${base}/slow`, 300);
} catch (err) {
  console.log("Request aborted as expected:", err.name); // "AbortError"
}

server.close();
console.log("\nServer closed.");
