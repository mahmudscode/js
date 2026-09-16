# Chapter 27 — The DOM

## 27.1 What the DOM actually is

When a browser loads an HTML page, it doesn't just display the text of
your HTML file — it parses it into an in-memory tree of objects called the
**Document Object Model (DOM)**. Every tag becomes a **node** in that
tree, and JavaScript can read and mutate that tree through the `document`
object, which the browser then re-renders to the screen.

```html
<body>
  <div id="app">
    <h1>Hello</h1>
    <p>World</p>
  </div>
</body>
```

becomes, conceptually:

```
document
 └─ html
     └─ body
         └─ div#app
             ├─ h1 ("Hello")
             └─ p ("World")
```

This is why the DOM matters so much: it's the **live bridge** between your
JavaScript and what the user actually sees. `document` is not part of the
JavaScript language itself — it's a browser-provided API (see §1.4) — so
everything in this chapter only works in a browser (or a browser-like
environment such as `jsdom` in tests), never in plain Node.js.

## 27.2 Selecting elements

```js
document.getElementById("app");           // single element by id (fastest)
document.querySelector(".card");           // first match of any CSS selector
document.querySelectorAll(".card");        // ALL matches, as a NodeList
document.getElementsByClassName("card");   // live HTMLCollection (older API)
document.getElementsByTagName("li");       // live HTMLCollection
```

`querySelector`/`querySelectorAll` accept **any valid CSS selector**,
which makes them the most flexible and commonly used choice in modern
code:

```js
document.querySelector("ul > li:first-child");
document.querySelectorAll("input[type='checkbox']:checked");
document.querySelector("#app .card.active");
```

`querySelectorAll` returns a **static** `NodeList` (a snapshot at call
time); `getElementsByClassName`/`getElementsByTagName` return a **live**
`HTMLCollection` that automatically updates as the DOM changes. This
distinction occasionally matters — iterating a live collection while
adding/removing matching elements can produce surprising results.

`NodeList` supports `forEach` directly; `HTMLCollection` does not (convert
with `Array.from(collection)` first if you need array methods).

## 27.3 Traversing the tree

```js
const app = document.querySelector("#app");

app.parentElement;      // the element containing #app
app.children;            // HTMLCollection of direct element children
app.firstElementChild;   // first child element (ignores text nodes)
app.lastElementChild;
app.nextElementSibling;  // the next element at the same level
app.previousElementSibling;
```

There's a parallel, older set of properties (`.parentNode`,
`.childNodes`, `.firstChild`, `.nextSibling`, ...) that operate on **all**
nodes, including text nodes (like the whitespace between tags) and comment
nodes — almost always prefer the `Element`-suffixed versions above unless
you specifically need to see text/comment nodes.

## 27.4 Reading and writing content

```js
const el = document.querySelector("#app");

el.textContent;              // all text inside, with tags stripped
el.textContent = "New text"; // replaces content with plain text (safe)

el.innerHTML;                // the raw HTML markup inside the element
el.innerHTML = "<b>Bold</b>"; // parses and inserts as real elements
```

### `textContent` vs `innerHTML` — a real security boundary

`innerHTML` **parses** the string you assign as HTML. If that string ever
contains untrusted user input, this is a classic **XSS (Cross-Site
Scripting)** vulnerability — an attacker could set their display name to
`<img src=x onerror="stealCookies()">`, and if you ever render it with
`innerHTML`, that script executes in every visitor's browser.

```js
// DANGEROUS if `comment` came from user input:
el.innerHTML = comment;

// SAFE — always treated as plain text, never parsed as markup:
el.textContent = comment;
```

**Rule of thumb:** use `textContent` for any content that includes user
input, unless you specifically need to render sanitized HTML (in which
case, sanitize it with a dedicated library, never by hand).

## 27.5 Attributes vs. properties

Elements have both HTML **attributes** (what's written in the markup) and
JS **properties** (the live object's fields) — they usually stay in sync,
but not always, which trips people up:

```js
const input = document.querySelector("input");

input.getAttribute("value"); // the ORIGINAL value from the HTML markup
input.value;                  // the CURRENT value, including live user typing

input.setAttribute("disabled", ""); // add an attribute
input.removeAttribute("disabled");  // remove it
input.hasAttribute("disabled");      // check for it

input.disabled = true;  // most boolean attributes also have a matching property
```

For most day-to-day work (`value`, `checked`, `disabled`, `id`, `className`)
use the **property**; reach for `getAttribute`/`setAttribute` for custom
`data-*` attributes or attributes without a matching property (via
`dataset` — see below).

### `data-*` attributes and `.dataset`

```html
<li data-user-id="42" data-role="admin">Ada</li>
```

```js
const li = document.querySelector("li");
li.dataset.userId; // "42"   (camelCase automatically from kebab-case)
li.dataset.role;   // "admin"
li.dataset.role = "editor"; // updates the data-role attribute too
```

## 27.6 Creating, inserting, and removing elements

```js
const li = document.createElement("li");
li.textContent = "New item";
li.classList.add("item");

const list = document.querySelector("ul");
list.appendChild(li);            // add as the last child
list.prepend(li);                 // add as the first child
list.insertBefore(li, list.firstChild); // insert at a specific position

otherElement.before(li);   // insert li immediately before otherElement
otherElement.after(li);    // insert li immediately after otherElement
otherElement.replaceWith(li); // swap otherElement out for li

li.remove(); // remove an element from the DOM entirely
```

## 27.7 `classList` — the modern way to manage CSS classes

```js
const el = document.querySelector(".card");

el.classList.add("active");
el.classList.remove("hidden");
el.classList.toggle("selected");        // add if absent, remove if present
el.classList.toggle("selected", isSel); // force add/remove based on a boolean
el.classList.contains("active");         // true/false
el.className;                              // the full class string, e.g. "card active"
```

Prefer `classList` over manually building `el.className` strings — it
avoids duplicate classes and accidental whitespace bugs.

## 27.8 Inline styles

```js
el.style.color = "red";
el.style.backgroundColor = "black";   // camelCase for hyphenated CSS properties
el.style.setProperty("--accent", "blue"); // for CSS custom properties (variables)

getComputedStyle(el).fontSize; // the ACTUAL rendered value, including CSS from stylesheets
```

`el.style` only reflects styles set **inline** (directly on the element or
via JS) — it will not show you styles applied through an external or
`<style>` stylesheet. Use `getComputedStyle(el)` when you need the final,
rendered value regardless of where it came from. In general, prefer
toggling CSS **classes** over setting individual inline styles from JS —
it keeps your visual logic in CSS, where it's easier to maintain.

## 27.9 A note on performance: reflow and batching

Every time you change something that affects layout (adding elements,
changing size-affecting styles, reading certain properties like
`offsetHeight`), the browser may need to recalculate the page's layout
("reflow") and repaint it. Doing this in a tight loop, one element at a
time, can be slow:

```js
// Slow: triggers a layout recalculation on every iteration
for (const item of items) {
  list.appendChild(makeListItem(item)); // 1000 separate reflows, worst case
}

// Fast: build everything off-DOM first, then insert once
const fragment = document.createDocumentFragment();
for (const item of items) {
  fragment.appendChild(makeListItem(item));
}
list.appendChild(fragment); // a single reflow
```

`DocumentFragment` is a lightweight, in-memory container that isn't part
of the visible page — appending to it doesn't trigger a reflow, and
appending the whole fragment to the real DOM does so only once. This
pattern (batch changes, then apply once) is the core idea behind why
frameworks like React use a virtual DOM: to compute the minimal set of
real DOM changes and apply them together instead of one at a time.

## 27.10 Chapter summary

- The DOM is a live, in-memory tree representation of your HTML that
  JavaScript can read and mutate through the `document` object.
- `querySelector`/`querySelectorAll` (any CSS selector) are the modern,
  flexible way to find elements.
- Use `textContent` for user-supplied content to avoid XSS; reserve
  `innerHTML` for trusted or sanitized markup.
- Attributes (markup) and properties (live object state) usually stay in
  sync but aren't identical — use `.dataset` for custom `data-*`
  attributes.
- `createElement`/`appendChild`/`remove` build and tear down the tree;
  `classList` is the preferred way to manage CSS classes from JS.
- Batch DOM insertions with a `DocumentFragment` to avoid repeated,
  expensive layout recalculations.

## 27.11 Exercises

1. Open `examples/27-dom-manipulation.html` directly in a browser and use
   the working to-do list. Read through the `<script>` section and match
   each interaction to the API it uses.
2. Modify the demo so completed items get a `line-through` CSS class
   instead of just a `completed` marker class, using `classList.toggle`.
3. Add a "Clear completed" button that removes every item with the
   `completed` class in one batch operation.
