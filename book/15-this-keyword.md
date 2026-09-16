# Chapter 15 — The `this` Keyword

## 15.1 The one rule that fixes 90% of confusion

`this` is probably the single most misunderstood concept for developers
coming from other languages. In many object-oriented languages, `this` (or
`self`) always refers to "the instance the method was defined on." In
JavaScript, that's not true at all. The rule that actually governs `this`
is:

> **`this` is determined by *how* a function is called, not by *where* it
> is defined.**

The same function can have a completely different `this` value every time
it's called, depending on the call-site syntax. This chapter walks through
every rule that determines `this`, in the priority order JavaScript
actually applies them.

```js
function whoAmI() {
  console.log(this);
}

const obj = { name: "obj", whoAmI };

whoAmI();       // this === undefined (strict mode) or globalThis (sloppy mode)
obj.whoAmI();   // this === obj
```

It's the *exact same function* both times — only the call syntax changed,
and that alone changed what `this` refers to.

## 15.2 Rule 1 — Default binding (plain function call)

When a function is called with no context object in front of it
(`fn()`, not `obj.fn()`), `this` uses "default binding":

```js
"use strict";
function showThis() {
  console.log(this);
}
showThis(); // undefined, because this file/function runs in strict mode
```

```js
// Without "use strict" (sloppy mode, the historical default):
function showThisSloppy() {
  console.log(this);
}
showThisSloppy(); // the global object (globalThis / window)
```

ES modules and class bodies are *always* strict mode automatically, which
is one more reason plain function calls with `this` inside them are
dangerous in modern code — you'll get `undefined` rather than accidentally
mutating the global object.

## 15.3 Rule 2 — Implicit binding (method call)

When a function is called *as a property of an object* — `obj.method()` —
`this` inside that function is bound to the object immediately to the left
of the dot at the call site:

```js
const user = {
  name: "Ada",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

user.greet(); // "Hi, I'm Ada" — this === user
```

The critical trap: **implicit binding is only determined by the call
site, not by where the method was defined or which object "owns" it
conceptually.** If you pull the method off the object and call it bare,
you lose the binding:

```js
const greetFn = user.greet;
greetFn(); // "Hi, I'm undefined" — this is no longer `user`!
```

This is exactly what happens when you pass a method as a callback:

```js
function invokeLater(fn) {
  fn(); // called bare, with no object in front of it
}
invokeLater(user.greet); // "Hi, I'm undefined" — same problem
```

This single mechanism explains an enormous fraction of real-world "why is
`this` undefined" bugs: `setTimeout(user.greet, 1000)`,
`button.addEventListener("click", user.greet)`, and
`array.map(obj.transform)` are all "bare calls" from JavaScript's
perspective, even though it *looks* like the method still belongs to its
object.

## 15.4 Rule 3 — Explicit binding: `call`, `apply`, and `bind`

JavaScript gives you a way to *force* what `this` will be, overriding the
default and implicit rules.

- **`fn.call(thisArg, arg1, arg2, ...)`** — calls `fn` immediately, with
  `this` set to `thisArg`, passing arguments individually.
- **`fn.apply(thisArg, [arg1, arg2, ...])`** — identical to `call`, but
  arguments are passed as a single array.
- **`fn.bind(thisArg, arg1, ...)`** — does NOT call `fn`. Instead it
  returns a **new function** with `this` permanently locked to `thisArg`
  (this new binding cannot be overridden later, even by another `.call`).

```js
function introduce(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}

const ada = { name: "Ada Lovelace" };
const grace = { name: "Grace Hopper" };

introduce.call(ada, "Hello");     // "Hello, I'm Ada Lovelace"
introduce.apply(grace, ["Hi"]);   // "Hi, I'm Grace Hopper"

const introduceAda = introduce.bind(ada);
introduceAda("Hey");              // "Hey, I'm Ada Lovelace"
introduceAda.call(grace, "Yo");   // still "Yo, I'm Ada Lovelace" — bind wins!
```

### The classic fix using `bind`

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(function () {
      this.seconds++; // BUG: `this` here is not `timer` (bare call by setInterval)
      console.log(this.seconds);
    }, 1000);
  },
};
```

```js
const timerFixed = {
  seconds: 0,
  start() {
    setInterval(
      function () {
        this.seconds++;
        console.log(this.seconds);
      }.bind(this), // lock `this` to whatever `this` is right here (timerFixed)
      1000
    );
  },
};
```

## 15.5 Rule 4 — `new` binding

When a function is called with `new`, JavaScript creates a brand new
empty object, sets `this` inside the function to that new object, and
(unless the function explicitly returns another object) returns it
automatically. This is covered in full mechanical detail in Chapter 16;
for `this` purposes, the key point is that `new` creates a *fresh* `this`
every single call:

```js
function Person(name) {
  this.name = name; // this === the newly created object
}

const p1 = new Person("Ada");
const p2 = new Person("Grace");
console.log(p1.name, p2.name); // "Ada" "Grace" — separate `this` per call
```

## 15.6 Rule priority: which rule wins?

When more than one rule could apply, JavaScript resolves them in this
order, from highest to lowest precedence:

1. **`new` binding** — `new fn()`
2. **Explicit binding** — `fn.call(obj)`, `fn.apply(obj)`, or a function
   already `.bind()`-locked
3. **Implicit binding** — `obj.fn()`
4. **Default binding** — `fn()` alone

```js
function show() {
  console.log(this.label);
}
const bound = show.bind({ label: "bound object" });
const obj = { label: "obj", show: bound };

obj.show(); // "bound object" — explicit (bind) beats implicit (obj.show())
```

## 15.7 Arrow functions: no `this` of their own

Arrow functions are the one major exception to everything above. **Arrow
functions do not have their own `this` binding at all.** Instead, they
capture `this` lexically — exactly like a closure captures a variable —
from the nearest enclosing non-arrow function (or the module/global scope
if there is none). None of the four rules above apply to an arrow
function; you cannot change an arrow function's `this` with `call`,
`apply`, or `bind`.

```js
const user2 = {
  name: "Ada",
  greetArrow: () => {
    // this is captured from the surrounding scope at definition time —
    // here that's the module/global scope, NOT user2.
    console.log(this?.name); // undefined
  },
  greetRegular() {
    console.log(this.name); // "Ada" — implicit binding, correct
  },
};
user2.greetArrow();
user2.greetRegular();
```

This looks like a limitation, but it's exactly the tool you need to fix
the `setTimeout`/callback problem cleanly, *without* `bind` or a
`self = this` workaround:

```js
const timerArrow = {
  seconds: 0,
  start() {
    setInterval(() => {
      // arrow function: `this` is captured from `start()`'s scope,
      // where `this` correctly refers to `timerArrow`.
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
  },
};
```

This is why "use an arrow function for callbacks" became standard modern
JavaScript advice: arrow functions simply don't participate in the
rebinding problem at all.

### The old-school fix: `const self = this`

Before arrow functions existed (pre-ES6), developers solved this by
capturing `this` in a regular variable that a closure *could* see (since
closures capture variables, just not `this` specifically):

```js
const timerOldSchool = {
  seconds: 0,
  start() {
    const self = this; // capture into an ordinary variable
    setInterval(function () {
      self.seconds++; // `self` is just a normal closed-over variable
      console.log(self.seconds);
    }, 1000);
  },
};
```

You'll still see `self`/`that`/`_this` patterns in older codebases — now
you know exactly what problem they're solving.

## 15.8 `this` inside classes

Class methods behave like implicit-binding object methods: `this` refers
to the instance when called as `instance.method()`. The same "bare call
loses `this`" trap applies to class methods just as it does to plain
object methods — this is extremely common with event handlers:

```js
class Button {
  constructor(label) {
    this.label = label;
  }
  handleClick() {
    console.log(`${this.label} clicked`);
  }
}

const btn = new Button("Submit");
// btn.handleClick();                     // works: "Submit clicked"
// domElement.addEventListener("click", btn.handleClick); // BUG: bare call, this is undefined
```

Two idiomatic fixes are common in real class-based UI code:

```js
class ButtonFixedBind {
  constructor(label) {
    this.label = label;
    this.handleClick = this.handleClick.bind(this); // bind once, in the constructor
  }
  handleClick() {
    console.log(`${this.label} clicked`);
  }
}

class ButtonFixedArrow {
  label;
  constructor(label) {
    this.label = label;
  }
  // class field holding an arrow function: `this` is lexically captured
  // at the point the field is defined (i.e. bound to the instance).
  handleClick = () => {
    console.log(`${this.label} clicked`);
  };
}
```

## 15.9 Chapter summary

- `this` is set by the call site — how a function is invoked — not by
  where the function is defined.
- Priority order: `new` binding > explicit (`call`/`apply`/`bind`) >
  implicit (`obj.method()`) > default (bare `fn()`).
- Passing a method as a callback (`setTimeout(obj.method)`,
  `addEventListener("click", obj.method)`) strips its implicit binding —
  this is the single most common source of `this`-related bugs.
- `.bind()` returns a new function permanently locked to a given `this`
  and cannot be re-bound later.
- Arrow functions have no `this` of their own; they inherit it lexically
  from their enclosing scope, which makes them ideal for callbacks that
  need to preserve an outer `this`.
- In classes, bind event-handler methods in the constructor or define them
  as arrow-function class fields to avoid losing `this`.

## 15.10 Exercises

1. Given `const obj = { val: 42, getVal() { return this.val; } };`, write
   three different ways to call `getVal` such that it returns `undefined`
   or throws, and one way (other than `obj.getVal()`) that correctly
   returns `42`.
2. Explain why `array.forEach(obj.method)` can silently break `this` even
   though the code "looks fine," and show the fix using an arrow function.
3. Without running it, predict what `new (function () { console.log(this); })()`
   logs, and why `new` binding takes priority over everything else.
