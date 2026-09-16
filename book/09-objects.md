# Chapter 9 — Objects

## 9.1 What is an object?

An object is an unordered collection of key-value pairs (called
**properties**). Keys are always strings or `Symbol`s (numbers get
converted to strings), and values can be anything — primitives, functions,
arrays, or other objects. Objects are JavaScript's primary way of modeling
structured, named data.

```js
const user = {
  name: "Ada",
  age: 36,
  isAdmin: true,
};
```

Unlike arrays, objects don't guarantee numeric-index ordering by default —
though in practice modern engines iterate integer-like keys first in
ascending order, then string keys in insertion order, then symbols. Don't
rely on object property order for anything load-bearing; use an array (or
a `Map`, §9.10) when order matters.

## 9.2 Creating objects

```js
const literal = { a: 1, b: 2 };          // object literal — most common
const empty = {};
const fromCtor = new Object();            // rarely used, avoid
const fromCreate = Object.create(null);   // an object with NO prototype
                                           // (no inherited methods at all —
                                           // useful for pure dictionaries)
```

`Object.create(null)` is worth remembering: it produces an object that
doesn't even have `toString` or `hasOwnProperty` inherited from
`Object.prototype`, which makes it a safer choice when using an object as a
plain key-value dictionary where keys come from untrusted input (no risk of
a key named `"toString"` accidentally shadowing a real method — see §9.8).

## 9.3 Accessing and modifying properties

```js
const user = { name: "Ada", age: 36 };

// Dot notation — use when the key is a known, valid identifier
console.log(user.name); // "Ada"

// Bracket notation — required when the key is dynamic or not a valid
// identifier (contains spaces, starts with a number, etc.)
const key = "age";
console.log(user[key]);       // 36
console.log(user["full name"]); // undefined (property doesn't exist)

user.age = 37;                 // update existing property
user.email = "ada@example.com"; // add a new property
delete user.email;              // remove a property

console.log(user); // { name: 'Ada', age: 37 }
```

Accessing a property that doesn't exist returns `undefined`, never an
error — this is different from many other languages and is a frequent
source of `undefined is not a function`-style bugs when a typo goes
unnoticed (`user.naem`).

## 9.4 Computed property names and shorthand syntax

```js
const field = "score";
const dynamicObj = {
  [field]: 100,          // computed property name (ES2015)
  [`${field}_bonus`]: 10,
};
console.log(dynamicObj); // { score: 100, score_bonus: 10 }

// Shorthand property names — when a variable name matches the key you want
const name = "Grace";
const age = 45;
const person = { name, age }; // same as { name: name, age: age }

// Shorthand method syntax
const calculator = {
  value: 0,
  add(n) {          // same as add: function(n) { ... }
    this.value += n;
    return this;
  },
};
```

## 9.5 Enumerating an object: keys, values, entries

```js
const scores = { alice: 90, bob: 85, cy: 95 };

Object.keys(scores);    // ["alice", "bob", "cy"]
Object.values(scores);  // [90, 85, 95]
Object.entries(scores); // [["alice",90],["bob",85],["cy",95]]

// entries() pairs beautifully with for...of and destructuring
for (const [name, score] of Object.entries(scores)) {
  console.log(`${name}: ${score}`);
}

// and with Object.fromEntries() to go back the other direction —
// e.g. transforming every value
const doubled = Object.fromEntries(
  Object.entries(scores).map(([name, score]) => [name, score * 2])
);
console.log(doubled); // { alice: 180, bob: 170, cy: 190 }
```

## 9.6 Copying and merging objects

```js
const base = { a: 1, b: 2 };
const extra = { b: 20, c: 3 };

// Object.assign mutates and returns the FIRST argument
const merged1 = Object.assign({}, base, extra); // {} as target -> no mutation of base
console.log(merged1); // { a: 1, b: 20, c: 3 } — later sources win on conflicts

// Object spread — the modern, more readable equivalent (ES2018)
const merged2 = { ...base, ...extra };
console.log(merged2); // { a: 1, b: 20, c: 3 }

// Overriding a spread field explicitly
const updated = { ...base, b: 99 };
console.log(updated); // { a: 1, b: 99 }
```

**Both `Object.assign` and spread perform a *shallow* copy** — nested
objects/arrays are copied by reference, not deeply cloned:

```js
const original = { info: { city: "Lagos" } };
const shallowCopy = { ...original };
shallowCopy.info.city = "Nairobi";
console.log(original.info.city); // "Nairobi" — the nested object was shared!
```

### Deep cloning

```js
// structuredClone — built into modern Node.js and browsers, handles most
// real-world data (but not functions, and it has its own rules for
// special types like Map/Set/Date, which it DOES support correctly)
const deepCopy = structuredClone(original);
deepCopy.info.city = "Accra";
console.log(original.info.city); // "Nairobi" — untouched this time

// The old JSON trick — works for plain data but silently DROPS functions,
// undefined values, and Symbol keys, and turns Dates into strings. Only
// use it when you know the data is simple.
const jsonCopy = JSON.parse(JSON.stringify(original));
```

## 9.7 Freezing, sealing, and immutability

```js
const config = { debug: true };

Object.freeze(config);       // prevents adding, removing, or changing
config.debug = false;         // silently fails in non-strict mode
console.log(config.debug);    // still true
console.log(Object.isFrozen(config)); // true

const record = { id: 1 };
Object.seal(record);           // allows changing existing values,
record.id = 2;                  // but not adding/removing properties
record.extra = "no";            // silently ignored
console.log(record);            // { id: 2 }
```

**`Object.freeze` is shallow**, just like spread — a frozen object's
nested objects are still mutable unless you recursively freeze them.

## 9.8 The `in` operator vs `hasOwnProperty`

```js
const obj = { a: 1 };

"a" in obj;                    // true — checks OWN and INHERITED properties
"toString" in obj;              // true! inherited from Object.prototype
obj.hasOwnProperty("toString"); // false — only checks the object's OWN properties
Object.hasOwn(obj, "toString"); // false — modern (ES2022), safer alternative
                                  // to .hasOwnProperty because it works even
                                  // if `obj` has no prototype (Object.create(null))
```

Prefer `Object.hasOwn(obj, key)` over `obj.hasOwnProperty(key)` in new code
— it can't be broken by an object that happens to have its own property
named `hasOwnProperty`, and it works on `Object.create(null)` objects that
have no `hasOwnProperty` method to call at all.

## 9.9 Getters, setters, and property descriptors

Every object property actually has a hidden descriptor controlling its
behavior. `Object.defineProperty` gives you direct access to it:

```js
const person = { firstName: "Ada", lastName: "Lovelace" };

Object.defineProperty(person, "fullName", {
  get() {
    return `${this.firstName} ${this.lastName}`;
  },
  set(value) {
    [this.firstName, this.lastName] = value.split(" ");
  },
  enumerable: true,
});

console.log(person.fullName);   // "Ada Lovelace"
person.fullName = "Grace Hopper";
console.log(person.firstName);  // "Grace"
```

The same getter/setter syntax is available directly inside an object
literal, which is far more common in day-to-day code:

```js
const circle = {
  radius: 5,
  get area() {
    return Math.PI * this.radius ** 2;
  },
  set diameter(d) {
    this.radius = d / 2;
  },
};
console.log(circle.area.toFixed(2)); // "78.54"
circle.diameter = 20;
console.log(circle.radius); // 10
```

Descriptors also control `writable`, `enumerable` (does it show up in
`for...in`/`Object.keys`?), and `configurable` (can it be deleted or
redefined?) — this is how `Object.freeze` works under the hood, and how
built-in methods like `Array.prototype.map` stay hidden from
`Object.keys([])`.

## 9.10 Object vs Map: which to use

`Map` (covered fully as part of the built-in collections landscape) is
often a better choice than a plain object for dictionary-style data:

| | Object | Map |
|---|---|---|
| Key types | strings/symbols only | any value, including objects |
| Guaranteed insertion order | mostly, with integer-key caveat | always |
| Size | manual (`Object.keys(o).length`) | `map.size` |
| Iteration | needs `Object.entries` + loop | directly iterable |
| Performance for frequent add/remove | can degrade | optimized for this |
| JSON support | native | needs manual conversion |

**Rule of thumb**: use a plain object for fixed-shape records (a "struct")
where you know the field names ahead of time (`{ name, age, email }`); use
a `Map` for dynamic collections where keys are added/removed frequently or
aren't known in advance.

```js
const cache = new Map();
cache.set("user:1", { name: "Ada" });
cache.set(someObjectAsKey, "works fine as a key, unlike with objects");
console.log(cache.get("user:1"));
console.log(cache.size);
for (const [key, value] of cache) {
  console.log(key, value);
}
```

## 9.11 Optional chaining with objects

Optional chaining (`?.`, ES2020) short-circuits to `undefined` instead of
throwing when accessing a property on `null`/`undefined`:

```js
const response = { data: { user: null } };

console.log(response.data.user.name);   // TypeError: Cannot read properties of null
console.log(response.data.user?.name);  // undefined — no crash
console.log(response.data?.missing?.deeper?.field); // undefined, safely
console.log(response.data?.getUser?.());  // optional chaining on a method call too
```

Combine it with nullish coalescing (Chapter 4) for safe defaults:

```js
const displayName = response.data.user?.name ?? "Guest";
```

## 9.12 Chapter summary

- Objects are unordered key-value collections; keys are strings or
  symbols, values can be anything.
- Prefer object/computed/shorthand literal syntax over `new Object()`.
- `Object.assign` and spread both perform **shallow** copies; use
  `structuredClone` for real deep clones of plain data.
- `Object.freeze`/`seal` are also shallow — freeze nested objects
  individually if you need deep immutability.
- Prefer `Object.hasOwn(obj, key)` over `in` (which checks the whole
  prototype chain) or `.hasOwnProperty` (which can be shadowed).
- Getters/setters let a property look like data but run code on access.
- Choose `Map` over a plain object for dynamic, frequently-mutated
  key-value collections, especially with non-string keys.

## 9.13 Exercises

1. Write a function `pick(obj, keys)` that returns a new object containing
   only the given keys from `obj`, using `Object.fromEntries` and
   `Object.entries`.
2. Demonstrate, with code, why `{ ...original }` is not a safe way to copy
   an object containing a nested array, and fix it with `structuredClone`.
3. Explain the difference between `Object.freeze(obj)` and
   `Object.seal(obj)` in your own words, then verify your explanation by
   running both against the same object and testing add/remove/modify.
4. Run `examples/09-objects.js` and predict each line's output before it
   prints.
