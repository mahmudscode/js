# Chapter 28 — Events

## 28.1 The event model

The DOM is **event-driven**: instead of your code polling "did the user
click yet?", the browser fires **events** — click, keypress, form submit,
page load, and hundreds more — and your code subscribes to the ones it
cares about with **listeners**.

```js
button.addEventListener("click", (event) => {
  console.log("Clicked!", event);
});

button.removeEventListener("click", handlerFunction); // must be the SAME
                                                          // function reference
```

You can attach multiple listeners for the same event on the same element
— they all run, in the order they were added. `removeEventListener` only
works if you pass the exact same function reference that was added (an
inline arrow function passed directly to `addEventListener` can never be
removed later, because you have no reference to it).

## 28.2 The event object

Every listener receives an **event object** describing what happened:

```js
element.addEventListener("click", (event) => {
  event.type;          // "click"
  event.target;         // the actual element that triggered the event
  event.currentTarget;  // the element the listener is attached to
  event.clientX;         // mouse coordinates (for mouse events)
  event.key;             // the key pressed (for keyboard events)
  event.preventDefault();     // cancel the default browser behavior
  event.stopPropagation();     // stop the event from bubbling further
});
```

`event.target` vs. `event.currentTarget` is a frequent source of
confusion: if you attach a listener to a `<ul>` but the user clicks a
`<li>` inside it, `target` is the `<li>` (where the click actually
happened) while `currentTarget` is the `<ul>` (where the listener you're
inside of is attached). This distinction is the entire basis of **event
delegation** (§28.4).

## 28.3 Bubbling and capturing

When an event fires on an element, it doesn't just run listeners on that
element — it travels through the DOM tree in three phases:

1. **Capturing phase** — the event travels *down* from `window` to the
   target, through every ancestor.
2. **Target phase** — the event reaches the actual element it happened on.
3. **Bubbling phase** — the event travels back *up*, from the target
   through every ancestor again.

```
                 CAPTURE ↓          BUBBLE ↑
window
  └─ document
      └─ div#outer     ①  ────────────────   ⑥
          └─ div#middle  ②  ────────────    ⑤
              └─ div#inner (target)  ③ ── ④
```

By default, `addEventListener(type, handler)` listens during the
**bubbling** phase. Pass `true` (or `{ capture: true }`) as the third
argument to listen during **capturing** instead:

```js
outer.addEventListener("click", () => console.log("outer bubble"));
outer.addEventListener("click", () => console.log("outer capture"), true);
middle.addEventListener("click", () => console.log("middle bubble"));
inner.addEventListener("click", () => console.log("inner (target)"));

// Clicking #inner logs, in order:
// "outer capture"  -> capturing phase reaches outer first
// "inner (target)" -> target phase
// "middle bubble"  -> bubbling phase, innermost ancestor first
// "outer bubble"   -> bubbling phase continues up
```

Most everyday code only ever uses the default bubbling phase. Capturing is
mainly useful when you need to intercept an event **before** a child
element's own handler can act on it (e.g., a global "close all dropdowns"
handler).

## 28.4 Event delegation

Because events bubble, you don't need to attach a separate listener to
every single child element — you can attach **one** listener to a shared
parent and inspect `event.target` to figure out which child was actually
clicked. This is called **event delegation**, and it has two major
advantages:

- **Performance** — one listener instead of hundreds (e.g., for a table
  with 1,000 rows).
- **Works for elements that don't exist yet** — if you dynamically add new
  `<li>` items later, a delegated listener on the parent `<ul>` still
  catches clicks on them automatically, with zero extra code. A listener
  attached directly to each `<li>` would need to be re-attached every time
  you add a new one.

```js
list.addEventListener("click", (event) => {
  const item = event.target.closest("li"); // find the nearest <li> ancestor
  if (!item) return; // click landed outside any <li> (e.g. on the <ul> padding)
  console.log("Clicked item:", item.textContent);
});

// Adding a new item later needs NO new listener:
const li = document.createElement("li");
li.textContent = "New item";
list.appendChild(li); // clicking this still triggers the delegated handler
```

`Element.closest(selector)` walks **up** from the clicked element (or the
element itself) looking for the nearest ancestor matching the selector —
essential for delegation, since `event.target` might be a `<span>` or
`<svg>` nested inside the `<li>` you actually care about, not the `<li>`
itself.

## 28.5 `preventDefault` vs. `stopPropagation` vs. `stopImmediatePropagation`

These three methods are frequently confused because they sound similar but
control completely different things:

| Method | Stops... |
|---|---|
| `event.preventDefault()` | The browser's **default action** for this event (e.g., following a link, submitting a form, checking a checkbox) — does **not** affect bubbling |
| `event.stopPropagation()` | The event from **bubbling/capturing** to other elements — does **not** affect the browser's default action, and does **not** stop other listeners on the *same* element |
| `event.stopImmediatePropagation()` | Both propagation **and** any other listeners still queued on the *same* element |

```js
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading on submit
  // ...handle the form data with JS instead
});

child.addEventListener("click", (event) => {
  event.stopPropagation(); // parent's click listener will NOT fire
});
```

## 28.6 Custom events

You can define and dispatch your own events with `CustomEvent`, useful for
decoupled communication between unrelated parts of your code (e.g., a
cart module notifying a header badge component without either directly
referencing the other):

```js
const event = new CustomEvent("cart:updated", {
  detail: { itemCount: 3 }, // arbitrary data payload
  bubbles: true,              // whether it bubbles like a native event
});

document.dispatchEvent(event);

document.addEventListener("cart:updated", (event) => {
  console.log("Cart now has", event.detail.itemCount, "items");
});
```

## 28.7 Common events reference

| Event | Fires on | When |
|---|---|---|
| `click` | Any element | Mouse click (or Enter/Space on a focused button) |
| `dblclick` | Any element | Double click |
| `submit` | `<form>` | Form submission (button click or Enter in a field) |
| `input` | Form fields | Value changes, fires on **every keystroke** |
| `change` | Form fields | Value changes and the field **loses focus** (or a select/checkbox toggles) |
| `keydown` / `keyup` | Focused element | A key is pressed / released |
| `focus` / `blur` | Form fields | Element gains / loses focus (do not bubble!) |
| `mouseenter` / `mouseleave` | Any element | Pointer enters/leaves (do not bubble) |
| `mouseover` / `mouseout` | Any element | Pointer enters/leaves (**do** bubble) |
| `DOMContentLoaded` | `document` | HTML is fully parsed (before images/styles finish loading) |
| `load` | `window` | Everything (images, styles, scripts) has fully loaded |

`input` vs. `change` trips people up constantly: use `input` for
"respond immediately as the user types" (live search, character counters),
and `change` for "respond only once they're done" (validating a field
after they tab away).

## 28.8 Chapter summary

- Events let your code react to user/browser actions via
  `addEventListener`, which receives an event object describing what
  happened.
- Events travel through three phases: capturing (down), target, bubbling
  (up) — most listeners use the default bubbling phase.
- Event delegation exploits bubbling to handle many (including
  future/dynamic) child elements with a single listener on a shared
  ancestor, using `event.target.closest(...)`.
- `preventDefault` stops default browser behavior; `stopPropagation` stops
  bubbling/capturing; they are independent of each other.
- `CustomEvent` lets you build your own event-based communication between
  unrelated parts of an application.

## 28.9 Exercises

1. Open `examples/28-events.html` in a browser. Click the nested boxes and
   read the on-page log to see the exact bubbling/capturing order.
2. In the same file, click "Add item" several times, then click one of the
   newly-added list items — confirm the delegated listener still catches
   it without any new code running.
3. Modify the demo to call `stopPropagation()` on the middle box's click
   listener, and predict (then verify) which log lines disappear.
