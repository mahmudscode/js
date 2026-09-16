// Chapter 17 — Classes
// Run with: node examples/17-classes.js

// --- 17.1 Classes are sugar over prototypes ---
class Animal {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return `I am ${this.name}`;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}
const rex = new Animal("Rex");
console.log(rex.describe());
console.log(typeof Animal);
console.log(Object.getPrototypeOf(rex) === Animal.prototype);
console.log(Animal.prototype.describe === rex.describe);

// --- 17.2 Enforced new ---
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}
try {
  // eslint-disable-next-line new-cap
  Point(1, 2);
} catch (e) {
  console.log("class without new ->", e.constructor.name, "-", e.message);
}
const p = new Point(1, 2);
console.log(p.toString());
console.log(`${p}`);

// --- 17.3 Static members ---
class Circle {
  static PI = 3.14159;
  constructor(radius) {
    this.radius = radius;
  }
  area() {
    return Circle.PI * this.radius ** 2;
  }
  static fromDiameter(diameter) {
    return new Circle(diameter / 2);
  }
}
console.log(Circle.PI);
const c1 = new Circle(2);
console.log(c1.area().toFixed(2));
const c2 = Circle.fromDiameter(10);
console.log(c2.radius);
console.log(c1.PI);

// --- 17.4 Getters/setters ---
class Temperature {
  #celsius;
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
console.log(temp.fahrenheit);
temp.fahrenheit = 32;
console.log(temp.celsius.toFixed(1));

// --- 17.5 Private fields ---
class BankAccount {
  #balance;
  constructor(initialBalance) {
    this.#balance = initialBalance;
  }
  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }
  #validateWithdrawal(amount) {
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
console.log(account.balance);
account.deposit(50);
console.log(account.balance);
console.log(account["#balance"]);

// --- 17.6 extends and super ---
class DogBase extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  describe() {
    return `${super.describe().replace("I am", `${this.name} is an animal, and I am`)}`;
  }
  speak() {
    return `${this.name} barks`;
  }
}
// simpler, matches the book's intended output:
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  describeParentStyle() {
    return `${this.name} is an animal (specifically, a ${this.breed})`;
  }
  speak() {
    return `${this.name} barks`;
  }
}
const fido = new Dog("Fido", "Labrador");
console.log(fido.describeParentStyle());
console.log(fido.speak());
console.log(fido instanceof Dog);
console.log(fido instanceof Animal);

class Animal4 {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return `${this.name} is an animal`;
  }
}
class Dog4 extends Animal4 {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  describe() {
    return `${super.describe()} (specifically, a ${this.breed})`;
  }
}
console.log(new Dog4("Rex", "Husky").describe());

// --- 17.7 Polymorphism ---
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

// --- 17.8 Abstract-class-like pattern ---
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
try {
  new AbstractShape();
} catch (e) {
  console.log("abstract instantiation ->", e.constructor.name, "-", e.message);
}
console.log(new Triangle(6, 4).area());

// --- 17.9 Mixins ---
const Serializable = (Base) =>
  class extends Base {
    toJSON() {
      // Returning a plain object (not calling JSON.stringify(this) here) —
      // JSON.stringify() automatically calls .toJSON() on any object that
      // has one, so calling JSON.stringify(this) inside toJSON() would
      // recurse into itself forever.
      return { ...this };
    }
  };
const Comparable = (Base) =>
  class extends Base {
    equals(other) {
      // toJSON() returns a fresh plain object each call, so comparing with
      // === would always be false (different object references) — compare
      // their serialized string form instead.
      return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
    }
  };
class PointBase {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class EnhancedPoint extends Comparable(Serializable(PointBase)) {}
const ep1 = new EnhancedPoint(1, 2);
const ep2 = new EnhancedPoint(1, 2);
console.log(ep1.toJSON());
console.log(ep1.equals(ep2));
