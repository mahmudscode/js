// Chapter 16 — Prototypes and Inheritance
// Run with: node examples/16-prototypes-and-inheritance.js

// --- 16.1 Prototype chain basics ---
const animal = {
  eats: true,
  describe() {
    return "I am an animal";
  },
};
const dog = Object.create(animal);
dog.barks = true;

console.log(dog.eats);
console.log(dog.barks);
console.log(dog.describe());
console.log("dog.hasOwnProperty('eats'):", dog.hasOwnProperty("eats"));
console.log("dog.hasOwnProperty('barks'):", dog.hasOwnProperty("barks"));

// --- 16.2 Inspecting/setting prototypes ---
console.log(Object.getPrototypeOf(dog) === animal);
console.log(dog.__proto__ === animal);

const cat = {};
Object.setPrototypeOf(cat, animal);
console.log(cat.eats);

const plain = {};
console.log(Object.getPrototypeOf(plain) === Object.prototype);
console.log(Object.getPrototypeOf(Object.prototype));

// --- 16.3 Constructor functions and .prototype ---
function Animal(name) {
  this.name = name;
}
Animal.prototype.describe = function () {
  return `I am ${this.name}`;
};
const rex = new Animal("Rex");
console.log(rex.describe());
console.log(Object.getPrototypeOf(rex) === Animal.prototype);

// --- 16.4 What `new` does, manually reimplemented ---
function myNew(Constructor, ...args) {
  const newObj = {};
  Object.setPrototypeOf(newObj, Constructor.prototype);
  const result = Constructor.apply(newObj, args);
  return typeof result === "object" && result !== null ? result : newObj;
}
function Animal2(name) {
  this.name = name;
}
Animal2.prototype.describe = function () {
  return `I am ${this.name}`;
};
const manualRex = myNew(Animal2, "Rex");
console.log(manualRex.describe());

function Car(make) {
  "use strict";
  this.make = make;
}
try {
  Car("Toyota"); // called without `new`
} catch (e) {
  console.log("forgot new ->", e.constructor.name, "-", e.message);
}

// --- 16.5 instanceof and shadowing ---
console.log(rex instanceof Animal);
console.log(rex instanceof Object);
console.log({} instanceof Animal);

const rex2 = new Animal("Rex");
console.log(rex2.describe());
rex2.describe = function () {
  return "I'm overriding the prototype method!";
};
console.log(rex2.describe());
delete rex2.describe;
console.log(rex2.describe());

// --- 16.6 Manual inheritance chain ---
function Animal3(name) {
  this.name = name;
}
Animal3.prototype.describe = function () {
  return `${this.name} is an animal`;
};

function Dog(name, breed) {
  Animal3.call(this, name);
  this.breed = breed;
}
Dog.prototype = Object.create(Animal3.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function () {
  return `${this.name} says woof!`;
};
Dog.prototype.describe = function () {
  const base = Animal3.prototype.describe.call(this);
  return `${base} (specifically, a ${this.breed})`;
};

const fido = new Dog("Fido", "Labrador");
console.log(fido.describe());
console.log(fido.bark());
console.log(fido instanceof Dog);
console.log(fido instanceof Animal3);

// --- 16.7 Late-added prototype methods still work ---
function Widget() {}
const w = new Widget();
Widget.prototype.render = function () {
  return "rendering!";
};
console.log(w.render());

// --- Exercise 3 solution ---
function Shape() {}
Shape.prototype.area = function () {
  return 0;
};
function Circle(radius) {
  this.radius = radius;
}
Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;
Circle.prototype.area = function () {
  return Math.PI * this.radius ** 2;
};
const c = new Circle(2);
console.log("circle area:", c.area().toFixed(2));
console.log("circle instanceof Shape:", c instanceof Shape);
