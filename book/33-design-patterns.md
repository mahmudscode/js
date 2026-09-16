# Chapter 33 — Design Patterns

## 33.1 What patterns are for

A design pattern is a named, reusable solution to a problem that shows up
repeatedly in software design. Patterns aren't a language feature or a
library — they're vocabulary. Saying "just use an observer here" instantly
communicates a whole design to another engineer who knows the term, the way
"checkmate" communicates a complete chess position without describing every
piece. The value of learning patterns is almost entirely this shared
vocabulary plus recognizing the *shape* of a problem you've already seen
solved before — not memorizing rigid recipes to apply everywhere.

That said, patterns have a well-earned reputation for being overused. A
pattern applied where the problem doesn't call for it adds indirection and
ceremony without adding value — more on this in section 33.7. Learn them so
you can *recognize* when one fits, not so you can find an excuse to use one
in your next pull request.

## 33.2 The module pattern

Before ES2015 gave JavaScript real modules (Chapter 24), developers
simulated private state and public APIs using closures (Chapter 14) — the
**module pattern**:

```js
const counterModule = (function () {
  let count = 0; // private — inaccessible from outside this function

  function increment() {
    count += 1;
    return count;
  }

  function reset() {
    count = 0;
  }

  return { increment, reset }; // public API — the only way in
})();

counterModule.increment(); // 1
counterModule.increment(); // 2
console.log(counterModule.count); // undefined — truly private
```

An Immediately Invoked Function Expression (IIFE) creates a scope, runs
once, and returns an object exposing only the functions meant to be public.
`count` is only reachable through the closures `increment` and `reset`
retain over it. Native ES modules (each file already has its own private
scope, with `export` marking what's public) have made the IIFE version
largely obsolete for top-level module boundaries, but the *underlying
idea* — closures hiding state, exposing a small deliberate API — is still
exactly how you'd design a single object or factory-returned instance
today.

## 33.3 Singleton

A singleton ensures a class or module has exactly one instance, shared
everywhere it's used — typically for something genuinely global and
expensive to duplicate: a database connection pool, an application-wide
configuration object, a logging service.

```js
class Logger {
  static #instance;

  constructor() {
    if (Logger.#instance) {
      return Logger.#instance; // hand back the existing instance
    }
    this.logs = [];
    Logger.#instance = this;
  }

  log(message) {
    this.logs.push(message);
    console.log(`[LOG] ${message}`);
  }
}

const a = new Logger();
const b = new Logger();
console.log(a === b); // true — same instance
```

In JavaScript specifically, singletons are often achieved even more simply,
without a class at all: a module's top-level state is already a singleton,
because `import`ing the same module from anywhere gives you the same
already-evaluated module object. Reach for the class-based version only
when you specifically need the "first call creates it, later calls reuse
it" *lazy* initialization behavior shown above.

## 33.4 Factory

A factory is a function (or method) that creates and returns objects,
encapsulating creation logic that the caller shouldn't need to know about —
useful when object creation involves branching logic, or when you want to
create objects that share a shape without exposing which concrete
"subtype" gets built:

```js
function createUser(type, name) {
  const base = { name, createdAt: new Date() };

  switch (type) {
    case "admin":
      return { ...base, role: "admin", permissions: ["read", "write", "delete"] };
    case "editor":
      return { ...base, role: "editor", permissions: ["read", "write"] };
    default:
      return { ...base, role: "viewer", permissions: ["read"] };
  }
}

const alice = createUser("admin", "Alice");
const bob = createUser("viewer", "Bob");
```

The caller of `createUser` never needs to know the permission lists or how
they're derived from `type` — that logic lives in exactly one place instead
of being duplicated at every call site that needs a new user object.

## 33.5 Observer (and pub/sub)

The observer pattern — introduced conceptually in Chapter 30 alongside
Node's `EventEmitter`, and used constantly in the DOM (Chapter 28) — lets
one object (the "subject") notify a list of dependents (the "observers")
whenever something happens, without the subject knowing anything about who
its observers are.

```js
class Subject {
  #observers = [];

  subscribe(observerFn) {
    this.#observers.push(observerFn);
    return () => { // returns an "unsubscribe" function
      this.#observers = this.#observers.filter((fn) => fn !== observerFn);
    };
  }

  notify(data) {
    for (const observerFn of this.#observers) {
      observerFn(data);
    }
  }
}

const priceFeed = new Subject();

const unsubscribe = priceFeed.subscribe((price) => {
  console.log(`Price updated: $${price}`);
});

priceFeed.notify(42.5); // Price updated: $42.5
unsubscribe();
priceFeed.notify(43.0); // (nothing — listener was removed)
```

**Observer vs. pub/sub — a subtle but real distinction:** in the classic
observer pattern, the subject holds direct references to its observers and
calls them directly, as above. In a **publish/subscribe** system, publishers
and subscribers don't reference each other at all — they both talk to an
intermediary (a message broker, an event bus, or in the browser, something
like `window` as a shared event target) that routes messages between them.
Node's `EventEmitter` sits close to pure observer (you call `.on()`
directly on the specific emitter instance you care about); a message queue
like Redis pub/sub or a browser `CustomEvent` dispatched on a shared bus is
closer to true pub/sub, where publishers and subscribers can be added or
removed without either side knowing the other exists.

## 33.6 Decorator (the JavaScript-idiomatic way)

The decorator pattern wraps an object or function to add behavior without
modifying its original source. JavaScript's first-class functions make this
especially natural — no special language feature required (though a real
`@decorator` syntax for classes is also progressing through TC39):

```js
function withLogging(fn) {
  return function (...args) {
    console.log(`Calling ${fn.name} with`, args);
    const result = fn(...args);
    console.log(`${fn.name} returned`, result);
    return result;
  };
}

function add(a, b) {
  return a + b;
}

const loggedAdd = withLogging(add);
loggedAdd(2, 3);
// Calling add with [ 2, 3 ]
// add returned 5
```

`loggedAdd` behaves exactly like `add`, plus logging — `add` itself is
untouched, and you can compose multiple decorators (logging, timing,
caching) by wrapping a function in more than one at once. This is precisely
how many real-world tools work: Express middleware, React higher-order
components, and Redux middleware are all decorators by another name.

## 33.7 Strategy

The strategy pattern defines a family of interchangeable algorithms and
lets the caller pick which one to use at runtime, instead of hard-coding a
single algorithm (or a long `if`/`else` chain choosing between them) inside
the consuming code:

```js
const strategies = {
  cheapest: (options) => options.sort((a, b) => a.price - b.price)[0],
  fastest: (options) => options.sort((a, b) => a.etaMinutes - b.etaMinutes)[0],
  greenest: (options) => options.sort((a, b) => a.co2Grams - b.co2Grams)[0],
};

function chooseShippingOption(options, strategyName) {
  const strategy = strategies[strategyName] ?? strategies.cheapest;
  return strategy(options);
}
```

Because strategies here are just functions stored in an object, "picking a
strategy" is just looking up a key — no class hierarchy required. This is
a recurring theme in JavaScript: many classic object-oriented patterns,
originally described in a language (like C++ or Java) with mandatory
classes and no first-class functions, become simpler in JavaScript because
functions and objects can carry the same weight a whole class would in
those languages.

## 33.8 Don't over-engineer: patterns are tools, not goals

Every pattern in this chapter adds a layer of indirection in exchange for
some benefit (decoupling, flexibility, testability). That trade is worth
making when the benefit is real and needed *now* — not because a problem
*could theoretically* need that flexibility someday. Signs a pattern is
being reached for reflexively rather than usefully:

- A "factory" that only ever constructs one kind of object, with no
  branching logic — it's just a constructor with extra steps.
- A "strategy" object with exactly one strategy that never changes — it's
  just a function.
- An "observer" system built for a UI element that only ever has one
  listener — a plain callback would do.
- A singleton used for something that isn't actually global (most classes
  that "could" be a singleton don't need to be).

The best JavaScript engineers reach for patterns *after* noticing the same
shape of problem recur, not before writing the first version of something.
When in doubt, write the plain, direct version first; reach for the named
pattern once the code is telling you, through actual duplication or actual
coupling pain, that it wants one.

## 33.9 Chapter summary

- Patterns are shared vocabulary for recurring problem shapes, not
  mandatory scaffolding.
- The module pattern uses closures to hide private state behind a small
  public API — largely superseded by ES modules for top-level code, but
  the underlying idea remains everywhere.
- Singletons guarantee one shared instance; in JavaScript, a module's
  top-level state is often already a singleton without any extra code.
- Factories centralize object-creation branching logic in one place.
- Observer lets a subject notify subscribed listeners without knowing who
  they are; pub/sub goes further, routing through a shared intermediary so
  publishers and subscribers never reference each other.
- Decorators wrap functions/objects to add behavior without modifying the
  original — natural in JavaScript thanks to first-class functions.
- Strategy swaps interchangeable algorithms via a lookup instead of a
  branching chain.
- Apply patterns when a problem's shape calls for them, not by default.

## 33.10 Exercises

1. Refactor the `withLogging` decorator into a `withTiming` decorator that
   logs how long `fn` took to run (see `console.time`/`console.timeEnd`,
   also used in Chapter 34), then compose both decorators around the same
   function.
2. Take the `Subject`/observer example and rewrite it as a small pub/sub
   "event bus" object that many unrelated publishers and subscribers could
   share, instead of each subject managing its own observer list.
3. Find one place in a personal or work project where a `switch` statement
   choosing behavior could be replaced with the strategy pattern's
   lookup-object approach, and judge honestly whether doing so would
   actually improve the code or just add indirection.
