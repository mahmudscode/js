# Chapter 17 — Classes

## 17.1 Classes are sugar over prototypes

ES6 introduced the `class` keyword, giving JavaScript syntax that *looks*
like classical object-oriented languages. Under the hood, a `class` still
builds the exact same prototype-chain structure covered in Chapter 16 —
`class` did not change JavaScript's object model, it just gave it a
cleaner, less error-prone syntax and closed off some of the sharpest
footguns (like forgetting `new`, discussed below).

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return `I am ${this.name}`;
  }
}

const rex = new Animal("Rex");
console.log(rex.describe());                                 // "I am Rex"
console.log(typeof Animal);                                  // "function" — a class IS a function
console.log(Object.getPrototypeOf(rex) === Animal.prototype); // true — same mechanism as ch.16
console.log(Animal.prototype.describe === rex.describe);      // true — method lives on the prototype, shared
```

`describe` is defined once on `Animal.prototype`, exactly like the manual
`Animal.prototype.describe = function() {...}` pattern from Chapter 16 —
`class` just writes that boilerplate for you.

## 17.2 Constructors, instance methods, and enforced `new`

The `constructor` method runs once per `new` call and sets up instance
state. Unlike old-style constructor functions, **class constructors throw
a `TypeError` if called without `new`** — one of several footguns `class`
closes off deliberately:

```js
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

// Point(1, 2); // TypeError: Class constructor Point cannot be invoked without 'new'
const p = new Point(1, 2);
console.log(p.toString()); // "(1, 2)"
console.log(`${p}`);       // "(1, 2)" — template literals call toString() automatically
```

Every method written inside a `class` body (other than `constructor`)
automatically becomes a **non-enumerable** property on the prototype
(unlike a plain object literal method, which is enumerable). This means
`for...in` and `Object.keys()` won't list class methods, matching the
behavior of built-in methods like `Array.prototype.map`.

## 17.3 Static methods and static fields

`static` members belong to the class itself, not to instances — useful for
utility/factory functions logically related to the class:

```js
class Circle {
  static PI = 3.14159; // static field (class-level "constant")

  constructor(radius) {
    this.radius = radius;
  }

  area() {
    return Circle.PI * this.radius ** 2;
  }

  static fromDiameter(diameter) {
    // static factory method: an alternative way to construct instances
    return new Circle(diameter / 2);
  }
}

console.log(Circle.PI);                    // 3.14159 — accessed on the class, not an instance
const c1 = new Circle(2);
console.log(c1.area().toFixed(2));         // "12.57"
const c2 = Circle.fromDiameter(10);
console.log(c2.radius);                    // 5
// c1.PI is undefined — static members are NOT inherited onto instances
console.log(c1.PI);                        // undefined
```

## 17.4 Getters and setters

Getters/setters let you define properties that run code on read/write
while still being accessed with plain property syntax (`obj.prop`, not
`obj.prop()`):

```js
class Temperature {
  #celsius; // private field, see 17.5

  constructor(celsius) {
    this.#celsius = celsius;
  }

  get fahrenheit() {
    return this.#celsius * (9 / 5) + 32;
  }

  set fahrenheit(f) {
    this.#celsius = (f - 32) * (5 / 9);
  }

  get celsius() {
    return this.#celsius;
  }
}

const temp = new Temperature(25);
console.log(temp.fahrenheit);   // 77 — reads like a plain property, runs code
temp.fahrenheit = 32;
console.log(temp.celsius.toFixed(1)); // "0.0" — write also ran code, converted back
```

## 17.5 Private fields (`#field`)

Before ES2022's `#`-prefixed private fields, JavaScript had no true
built-in privacy at the class level — only the closure-based module
pattern from Chapter 14 could hide state completely. Private fields close
that gap directly in class syntax. A field or method prefixed with `#` is
only accessible from inside the class body — not from outside, not even
via `Object.keys` or bracket-notation tricks:

```js
class BankAccount {
  #balance; // must be declared here (or in the constructor) before use

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }

  #validateWithdrawal(amount) {
    // private METHOD — internal helper, not part of the public API
    if (amount > this.#balance) throw new Error("Insufficient funds");
  }

  withdraw(amount) {
    this.#validateWithdrawal(amount);
    this.#balance -= amount;
    return this.#balance;
  }

  get balance() {
    return this.#balance;
  }
}

const account = new BankAccount(100);
console.log(account.balance);      // 100 (via the public getter)
account.deposit(50);
console.log(account.balance);      // 150
console.log(account.balance);      // still fine — public getter is allowed
// console.log(account.#balance);  // SyntaxError: outside the class body, # is illegal
console.log(account["#balance"]);  // undefined — bracket notation cannot reach it either
```

Unlike the closure-based module pattern, `#` fields are a real part of the
class's shape, checked at parse time — accessing `#field` from outside
the class isn't just `undefined`, it's a `SyntaxError` before the code
even runs.

## 17.6 `extends` and `super`

`extends` sets up the prototype chain between two classes automatically —
exactly the `Object.create(Parent.prototype)` wiring you built by hand in
Chapter 16. `super` gives you two related but distinct things: calling
`super(...)` in a constructor invokes the parent's constructor, and
calling `super.method()` in a method invokes the parent's version of that
method.

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return `${this.name} is an animal`;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // MUST call super() before using `this` in a subclass constructor
    this.breed = breed;
  }

  describe() {
    // call the parent version, then extend its result
    return `${super.describe()} (specifically, a ${this.breed})`;
  }

  speak() {
    return `${this.name} barks`; // fully overrides the parent version, no super call
  }
}

const fido = new Dog("Fido", "Labrador");
console.log(fido.describe()); // "Fido is an animal (specifically, a Labrador)"
console.log(fido.speak());    // "Fido barks"
console.log(fido instanceof Dog);    // true
console.log(fido instanceof Animal); // true
```

**A hard rule:** in a subclass constructor, you cannot access `this` at
all until `super()` has been called — the parent constructor is
responsible for actually creating the instance's initial state (this
mirrors the `new` mechanics from Chapter 16, where a "super constructor
call" is exactly `Parent.call(this, ...)`).

```js
class Broken extends Animal {
  constructor(name) {
    this.name = name; // ReferenceError: must call super() before accessing 'this'
    super(name);
  }
}
```

## 17.7 Method overriding and polymorphism

Because JavaScript resolves methods dynamically through the prototype
chain, a collection of different subclass instances can be treated
uniformly — call the same method name on each, and the correct
"overridden" version runs automatically. This is **polymorphism**:

```js
class Shape {
  area() {
    return 0;
  }
}
class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }
  area() {
    return this.side ** 2;
  }
}
class Circle2 extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
  area() {
    return Math.PI * this.radius ** 2;
  }
}

const shapes = [new Square(4), new Circle2(3), new Shape()];
for (const shape of shapes) {
  console.log(shape.constructor.name, "area:", shape.area().toFixed(2));
}
// Square area: 16.00
// Circle2 area: 28.27
// Shape area: 0.00
```

## 17.8 Abstract-class-like patterns

JavaScript has no built-in `abstract` keyword, but you can approximate an
abstract base class (a class meant only to be extended, never instantiated
directly) by checking in the constructor:

```js
class AbstractShape {
  constructor() {
    if (new.target === AbstractShape) {
      throw new TypeError("AbstractShape cannot be instantiated directly");
    }
  }
  area() {
    throw new Error("Subclasses must implement area()");
  }
}

class Triangle extends AbstractShape {
  constructor(base, height) {
    super();
    this.base = base;
    this.height = height;
  }
  area() {
    return (this.base * this.height) / 2;
  }
}

// new AbstractShape(); // throws TypeError
console.log(new Triangle(6, 4).area()); // 12
```

`new.target` refers to the constructor that was actually invoked with
`new` — for a direct `new AbstractShape()` call it equals `AbstractShape`,
but when constructing via a subclass it equals that subclass instead,
which is exactly the distinction this pattern needs.

## 17.9 Mixins: composing behavior without deep hierarchies

JavaScript classes only support single inheritance (`extends` takes one
parent). **Mixins** are a pattern for sharing behavior across unrelated
classes by writing functions that take a base class and return an extended
version of it:

```js
const Serializable = (Base) =>
  class extends Base {
    toJSON() {
      // Return a plain object, NOT JSON.stringify(this) — JSON.stringify()
      // automatically calls .toJSON() on any object that defines one, so
      // calling it on `this` from inside toJSON() would recurse forever.
      return { ...this };
    }
  };

const Comparable = (Base) =>
  class extends Base {
    equals(other) {
      // toJSON() returns a fresh object each call, so compare the
      // serialized strings rather than the objects themselves with ===.
      return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
    }
  };

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class EnhancedPoint extends Comparable(Serializable(Point)) {}

const p1 = new EnhancedPoint(1, 2);
const p2 = new EnhancedPoint(1, 2);
console.log(p1.toJSON());     // { x: 1, y: 2 }
console.log(p1.equals(p2));   // true — behavior from BOTH mixins, composed
```

## 17.10 Common class design mistakes

- **Deep inheritance chains** (`A extends B extends C extends D`) tend to
  become fragile — a change to a distant ancestor can break far-away
  subclasses in surprising ways ("the fragile base class problem"). Prefer
  composition (mixins, or simply passing collaborator objects in) over
  deep hierarchies where practical.
- **Putting mutable shared state on a static field** and expecting each
  instance to have its own copy — static fields are shared across *all*
  instances, exactly like `Animal.prototype` methods are shared, not
  copied.
- **Overriding a method but forgetting `super.method()`** when the
  subclass was supposed to *extend* behavior rather than fully replace
  it — silently dropping the parent's logic.
- **Using classes for things that are really just data** — a plain object
  or a factory function (Chapter 33) is often simpler and avoids `this`
  pitfalls entirely when you don't actually need inheritance or private
  state.

## 17.11 Chapter summary

- `class` is syntactic sugar over the prototype mechanism from Chapter 16
  — methods still live on `.prototype` and are shared across instances.
- Class constructors throw if called without `new`, unlike old-style
  constructor functions.
- `static` members belong to the class itself, not instances; they are not
  inherited by instances.
- Getters/setters (`get`/`set`) let property-style syntax run custom logic.
- `#field` gives true, enforced-at-parse-time private state and methods.
- `extends`/`super` wire up the prototype chain and let subclass
  constructors/methods call into their parent's implementation.
- Mixins compose behavior across unrelated classes when single inheritance
  isn't enough — prefer composition over deep inheritance chains.

## 17.12 Exercises

1. Write a `Stack` class with private `#items`, and `push`, `pop`, `peek`,
   and a `size` getter. Verify from outside the class that `#items` cannot
   be accessed directly.
2. Create an `Employee` class and a `Manager` subclass that overrides a
   `describe()` method but still calls `super.describe()` to include the
   base description.
3. Explain why `new.target === AbstractShape` correctly distinguishes a
   direct instantiation from a subclass instantiation, referencing how
   `super()` sets up `this` from Chapter 16's `new` mechanics.
