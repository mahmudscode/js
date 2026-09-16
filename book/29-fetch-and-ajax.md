# Chapter 29 — Fetch, AJAX, and HTTP

## 29.1 A brief history

**AJAX** (Asynchronous JavaScript and XML) is the general technique of a
web page making an HTTP request *after* it has already loaded, without a
full page reload — the thing that made Gmail-style single-page apps
possible in the mid-2000s. The name is historical; nobody actually sends
XML anymore (JSON won), but "AJAX request" stuck as the generic term.

- **`XMLHttpRequest` (XHR)** — the original browser API for this, from
  1999. It works, but its callback-based, event-driven API
  (`onreadystatechange`, checking `readyState` and `status` manually) is
  verbose and easy to get wrong.
- **jQuery's `$.ajax()`** — a popular wrapper around XHR that dominated
  the 2010s, offering a much nicer callback/promise-like API before the
  platform caught up.
- **`fetch`** — the modern, native, promise-based replacement, available
  in every modern browser and (since Node 18) in Node.js itself, with no
  library required.

This chapter focuses on `fetch`, which is what you should reach for in new
code.

## 29.2 The `fetch` API basics

```js
const response = await fetch("https://api.example.com/users");
const data = await response.json(); // parses the response body as JSON
console.log(data);
```

`fetch(url, options)` returns a **Promise that resolves to a `Response`
object** representing the HTTP response — headers, status code, and a
body you read separately using one of several methods:

```js
response.json();  // parse body as JSON -> Promise<any>
response.text();   // read body as plain text -> Promise<string>
response.blob();   // read body as binary data -> Promise<Blob>
response.status;    // e.g. 200, 404, 500
response.ok;         // true if status is in the 200-299 range
response.headers.get("Content-Type");
```

### GET request (the default)

```js
const res = await fetch("/api/products");
const products = await res.json();
```

### POST request with a JSON body

```js
const res = await fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Widget", price: 9.99 }),
});
const created = await res.json();
```

You must set the `Content-Type` header yourself when sending JSON —
`fetch` does not infer it from the body — and `body` must be a **string**
(or `FormData`/`Blob`/etc.), so a plain object always needs
`JSON.stringify` first.

## 29.3 The gotcha: `fetch` does NOT reject on HTTP errors

This surprises almost everyone the first time: **`fetch`'s promise only
rejects on network failure** (DNS failure, no connection, CORS block) —
**not** when the server responds with a 404 or 500. A "successful" fetch
of a 404 page still resolves normally; you must check `response.ok`
yourself:

```js
async function getUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) {
    // This branch runs for 404, 500, etc — fetch did NOT throw for these.
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

try {
  const user = await getUser(999);
} catch (err) {
  console.error(err.message); // "Request failed: 404 Not Found"
}
```

Forgetting this check is one of the most common real-world bugs in fetch
code — a 404 response silently "succeeds" and you get a confusing crash
later when you try to read a field from an error page's body instead of
the JSON you expected.

## 29.4 `async`/`await` with fetch

Because `fetch` is promise-based, it pairs naturally with `async`/`await`
(Chapter 23) for readable sequential code, including proper error
handling with `try/catch`:

```js
async function loadDashboard(userId) {
  try {
    const [user, orders] = await Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch(`/api/users/${userId}/orders`).then((r) => r.json()),
    ]);
    return { user, orders };
  } catch (err) {
    console.error("Dashboard load failed:", err);
    throw err;
  }
}
```

## 29.5 Cancelling requests with `AbortController`

Sometimes you need to cancel an in-flight request — the classic example is
a search-as-you-type box, where you want to abandon a stale request if the
user keeps typing:

```js
let controller;

async function search(query) {
  controller?.abort(); // cancel any previous, still-pending search
  controller = new AbortController();

  try {
    const res = await fetch(`/api/search?q=${query}`, {
      signal: controller.signal,
    });
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Previous search cancelled — ignoring");
      return; // not a real error, just an intentional cancellation
    }
    throw err;
  }
}
```

`AbortController` is also the standard way to implement request timeouts:

```js
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
```

## 29.6 CORS — why you sometimes see errors in the console

Browsers enforce the **same-origin policy**: by default, JavaScript
running on `https://siteA.com` cannot read responses from
`https://siteB.com` — even though the request itself may actually reach
the server. This exists to protect users: without it, any malicious page
you accidentally visited could make authenticated requests to your bank
using cookies your browser automatically attaches, and read the response.

**CORS (Cross-Origin Resource Sharing)** is the mechanism that lets a
server *opt in* to allowing specific other origins to read its responses,
via response headers like:

```
Access-Control-Allow-Origin: https://siteA.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

If those headers are missing or don't match, the browser blocks your JS
from reading the response and logs a CORS error in the console — this is
a **browser-enforced client-side restriction**, not something you can fix
from the requesting page's JavaScript. It must be fixed on the **server**
you're calling (by adding the right headers), or worked around with a
proxy server you control. This is also why CORS errors never happen in
Node.js scripts or `curl` — the same-origin policy is a browser-specific
security feature, not an HTTP-level restriction.

For requests with methods/headers beyond simple `GET`/`POST` with basic
headers, browsers first send an automatic **preflight** `OPTIONS` request
to ask the server "would you allow this?" before sending the real request
— you'll sometimes see this extra OPTIONS request in your network tab.

## 29.7 Node.js's built-in `fetch` vs. browser `fetch`

Since **Node.js 18**, `fetch` is available globally with no import and no
extra dependency (like `node-fetch`), and behaves almost identically to
the browser version — same `Response`/`Request`/`Headers` classes, same
promise-based API. The differences that matter in practice:

- **No CORS in Node.js** — CORS is a browser security feature; a Node
  script can fetch from any server that allows the *connection* itself,
  regardless of `Access-Control-Allow-Origin` headers.
- **No cookies/credentials by default the same way** — browsers
  automatically attach same-origin cookies; Node's fetch does not have a
  browser cookie jar at all.
- Both support `AbortController`, streaming bodies, and the same
  `Response` methods (`.json()`, `.text()`, etc.).

This means you can write fetch-based code once and mostly reuse it in
both environments — a big part of why libraries increasingly ship
"isomorphic" HTTP logic.

## 29.8 Chapter summary

- `fetch(url, options)` is the modern, native, promise-based way to make
  HTTP requests, replacing `XMLHttpRequest` and jQuery's `$.ajax`.
- `fetch`'s promise resolves even for 4xx/5xx responses — **always check
  `response.ok`** before treating a request as successful.
- POST/PUT requests need `JSON.stringify` on the body and an explicit
  `Content-Type: application/json` header.
- `AbortController` lets you cancel in-flight requests or implement
  timeouts.
- CORS is a **browser-only**, server-controlled security mechanism
  governing which origins may *read* a cross-origin response — it cannot
  be fixed from the calling page's JavaScript.
- Node.js 18+ has a built-in `fetch` with the same core API as browsers,
  minus browser-specific concerns like CORS and automatic cookies.

## 29.9 Exercises

1. Run `examples/29-fetch-and-ajax.js`. It starts its own local HTTP
   server and makes real GET/POST requests against it with Node's
   built-in fetch — no internet connection required.
2. Modify the example to request a route that doesn't exist, and confirm
   `response.ok` is `false` and `response.status` is `404` even though
   `fetch` did not throw.
3. Add a request timeout using `AbortController` and `setTimeout`, and
   test it against an endpoint you make artificially slow.
