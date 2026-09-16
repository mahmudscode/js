# Chapter 16 — Prototypes and Inheritance

## 16.1 JavaScript is prototype-based, not class-based

Before ES6 introduced `class` syntax, JavaScript had no `class` keyword at
all — and even today, `class` is **syntactic sugar** over the same
mechanism that has always powered JavaScript: **prototypal inheritance**.
Understanding prototypes is understanding what `class` actually compiles
down to, and it explains a large category of behavior that otherwise looks
like magic.

The core idea: every JavaScript object has an internal, hidden link to
another object called its **prototype**. When you access a property on an
object and that property isn't found directly on the object itself,
JavaScript automatically looks it up on the object's prototype. If it's
not there either, JavaScript looks at the prototype's prototype, and so
on, until it either finds the property or reaches the end of the chain
(`null`). This chain of linked objects is the **prototype chain**.

```js
const animal = {
  eats: true,
  describe() {
    return "I am an animal";
  },
};

const dog = Object.create(animal); // dog's prototype is `animal`
dog.barks = true;

console.log(dog.eats);       // true — not on `dog`, found on its prototype `animal`
console.log(dog.barks);      // true — found directly on `dog`
console.log(dog.describe()); // "I am an animal" — method found via the chain
```

`dog` doesn't have an `eats` property of its own — you can verify this
with `dog.hasOwnProperty("eats")` (`false`) vs
`dog.hasOwnProperty("barks")` (`true`). The property lookup *walked up*
the prototype chain to find `eats` on `animal`.

## 16.2 Inspecting and setting the prototype

```js
console.log(Object.getPrototypeOf(dog) === animal); // true
console.log(dog.__proto__ === animal);               // true (legacy accessor, same thing)

const cat = {};
Object.setPrototypeOf(cat, animal);
console.log(cat.eats); // true
```

`Object.getPrototypeOf()`/`Object.setPrototypeOf()` are the modern,
recommended API. `__proto__` is a legacy accessor property that does the
same thing but is considered deprecated for direct use (it's kept only for
backward compatibility with old browser code) — `Object.create` and
`Object.getPrototypeOf`/`setPrototypeOf` are preferred in new code.

Every object literal you create with `{}` automatically gets
`Object.prototype` as its prototype (unless you override it), which is
where all the familiar methods like `.hasOwnProperty()`, `.toString()`,
and `.valueOf()` actually live:

```js
const plain = {};
console.log(Object.getPrototypeOf(plain) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype));            // null — end of the chain
```

`Object.prototype` is where the chain terminates for ordinary objects —
its own prototype is `null`.

## 16.3 Constructor functions and `.prototype`

Before `class`, JavaScript developers created "instances" using regular
functions called with `new`, combined with a special property every
function automatically has: `.prototype`.

**Important terminology trap:** every *function* has a `.prototype`
*property* (an object that will become the prototype of instances created
with `new`), which is completely different from the internal prototype
*link* every object has (accessible via `Object.getPrototypeOf`). Beginners
conflate these constantly.

```js
function Animal(name) {
  this.name = name;
}

// Methods go on the constructor's .prototype, NOT redefined per instance.
Animal.prototype.describe = function () {
  return `I am ${this.name}`;
};

const rex = new Animal("Rex");
console.log(rex.describe());                              // "I am Rex"
console.log(Object.getPrototypeOf(rex) === Animal.prototype); // true
```

Putting `describe` on `Animal.prototype` instead of inside the constructor
means every instance *shares one copy* of the function in memory, rather
than each instance carrying its own separate copy — a meaningful memory
and performance win when you create many instances.

```js
// BAD: wastes memory — every instance gets its own copy of the function
function AnimalWasteful(name) {
  this.name = name;
  this.describe = function () {
    return `I am ${this.name}`;
  };
}
```

## 16.4 What `new` actually does, step by step

`new Animal("Rex")` performs four steps, in order:

1. A brand-new, empty object is created: `{}`.
2. That new object's internal prototype is linked to `Animal.prototype`
   (i.e., `Object.setPrototypeOf(newObj, Animal.prototype)`).
3. The constructor function runs with `this` bound to the new object
   (implementing `Rule 4: new binding` from Chapter 15).
4. If the constructor function doesn't explicitly return an object of its
   own, `new` automatically returns the new object that was built in steps
   1–3. (If the function *does* return some other object, that object is
   returned instead and the newly created one is discarded — a rarely used
   escape hatch.)

Here is that exact sequence written out manually, to fully demystify it:

```js
function myNew(Constructor, ...args) {
  const newObj = {};                                  // step 1
  Object.setPrototypeOf(newObj, Constructor.prototype); // step 2
  const result = Constructor.apply(newObj, args);       // step 3
  return (typeof result === "object" && result !== null) ? result : newObj; // step 4
}

function Animal2(name) {
  this.name = name;
}
Animal2.prototype.describe = function () {
  return `I am ${this.name}`;
};

const manualRex = myNew(Animal2, "Rex");
console.log(manualRex.describe()); // "I am Rex" — behaves identically to `new Animal2("Rex")`
```

### Forgetting `new`

If you call a constructor function *without* `new`, none of the four steps
happen — it's just a regular function call, and `this` follows the normal
rules from Chapter 15 (in strict mode, `this` is `undefined`):

```js
function Car(make) {
  "use strict";
  this.make = make; // TypeError: Cannot set properties of undefined
}
// const oops = Car("Toyota"); // throws, because Car() has no `new`, this is undefined
```

This is one reason class constructors (Chapter 17) throw an explicit error
if called without `new` — the language decided to make this footgun
impossible for `class`, even though it's still possible for old-style
constructor functions.

## 16.5 `instanceof` and property shadowing

`instanceof` checks whether an object's prototype chain contains a given
constructor's `.prototype` object anywhere along it:

```js
console.log(rex instanceof Animal); // true — Animal.prototype is in rex's chain
console.log(rex instanceof Object); // true — Object.prototype is further up the chain
console.log({} instanceof Animal);  // false — plain object's chain never reaches Animal.prototype
```

**Property shadowing**: if an instance defines its own property with the
same name as something on its prototype, the instance's own property
"wins" — the lookup finds it first and never continues up the chain:

```js
const rex2 = new Animal("Rex");
console.log(rex2.describe()); // "I am Rex" (from Animal.prototype)

rex2.describe = function () {
  return "I'm overriding the prototype method!";
};
console.log(rex2.describe()); // "I'm overriding the prototype method!" (own property wins)

delete rex2.describe;
console.log(rex2.describe()); // back to "I am Rex" — shadowing removed, chain lookup resumes
```

This is exactly how method overriding works in prototype-based
inheritance — and it's exactly what `super.method()` inside a subclass
lets you bypass deliberately (Chapter 17).

## 16.6 Building an inheritance chain manually

Before `class extends` existed, this multi-step dance was how you built
inheritance between two constructor functions. Seeing it written out in
full is the best way to understand what `extends` (Chapter 17) does for
you automatically.

```js
function Animal3(name) {
  this.name = name;
}
Animal3.prototype.describe = function () {
  return `${this.name} is an animal`;
};

function Dog(name, breed) {
  Animal3.call(this, name); // "super constructor" call: reuse Animal3's setup logic
  this.breed = breed;
}

// Link Dog.prototype's prototype to Animal3.prototype (this is the inheritance step)
Dog.prototype = Object.create(Animal3.prototype);
Dog.prototype.constructor = Dog; // repair the constructor reference Object.create broke

// Dog can now add or override methods
Dog.prototype.bark = function () {
  return `${this.name} says woof!`;
};
Dog.prototype.describe = function () {
  // call the "parent" version explicitly, then extend it
  const base = Animal3.prototype.describe.call(this);
  return `${base} (specifically, a ${this.breed})`;
};

const fido = new Dog("Fido", "Labrador");
console.log(fido.describe());       // "Fido is an animal (specifically, a Labrador)"
console.log(fido.bark());           // "Fido says woof!"
console.log(fido instanceof Dog);   // true
console.log(fido instanceof Animal3); // true — inheritance chain confirmed
```

`Object.create(Animal3.prototype)` is the crucial line: it creates a new,
empty object whose prototype is `Animal3.prototype`, and assigns that as
`Dog.prototype`. Now any `Dog` instance's chain is:
`fido -> Dog.prototype -> Animal3.prototype -> Object.prototype -> null`.

**Common mistake:** writing `Dog.prototype = Animal3.prototype` directly
(instead of `Object.create(Animal3.prototype)`). This makes `Dog` and
`Animal3` share the *exact same* prototype object, so adding a method to
`Dog.prototype` would also silently add it to `Animal3.prototype` and
every plain `Animal3` instance. `Object.create` avoids this by creating a
fresh, separate object that merely *links to* `Animal3.prototype` rather
than *being* it.

## 16.7 Prototypal vs. classical inheritance

Classical inheritance (Java, C++, C#) works by copying behavior at
*compile time* into a rigid class hierarchy defined up front. Prototypal
inheritance works by *linking* objects together at runtime, and lookups
happen dynamically at the moment a property is accessed. This has a few
consequences that surprise developers coming from classical languages:

- You can change an object's prototype at runtime (`Object.setPrototypeOf`)
  — extremely unusual in classical OOP, and generally discouraged for
  performance reasons (it deoptimizes V8's internal object shape
  assumptions), but it demonstrates how dynamic the model is.
- You can create an object that inherits from another *specific object*
  directly, with `Object.create(someObject)`, without ever defining a
  "class" at all.
- Adding a method to a prototype *after* instances already exist still
  makes it available to those existing instances immediately, because
  lookup happens at access time, not at creation time:

```js
function Widget() {}
const w = new Widget();
Widget.prototype.render = function () {
  return "rendering!";
};
console.log(w.render()); // "rendering!" — works even though w was created first
```

## 16.8 Chapter summary

- Every object has an internal prototype link; property lookups walk up
  the prototype chain until found or the chain ends at `null`.
- `Object.getPrototypeOf`/`setPrototypeOf` inspect/change an object's
  prototype link; `__proto__` does the same but is legacy.
- Functions have a `.prototype` *property* (distinct from the object
  prototype *link*) that becomes new instances' prototype when used with
  `new`.
- `new` performs four steps: create an object, link its prototype, run the
  constructor with `this` bound to it, and return it (unless the
  constructor returns its own object).
- Property shadowing means an instance's own property hides a
  same-named property found further up the prototype chain.
- `class`/`extends` (Chapter 17) is sugar over exactly the manual pattern
  shown in 16.6: `Object.create` to link prototypes, and
  `Parent.call(this, ...)` to reuse parent setup logic.

## 16.9 Exercises

1. Given `function Foo() {}` and `const f = new Foo();`, list every object
   in `f`'s full prototype chain up to `null`.
2. Explain, in your own words, why `Dog.prototype = Object.create(Animal.prototype)`
   is correct but `Dog.prototype = Animal.prototype` is a bug.
3. Write a `Shape` constructor with a `.area()` method returning `0`, then
   a `Circle` constructor (taking a radius) that inherits from `Shape` and
   overrides `.area()` to return the correct circle area.
