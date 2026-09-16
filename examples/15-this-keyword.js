// Chapter 15 — The `this` Keyword
// Run with: node examples/15-this-keyword.js
"use strict";

// --- 15.1 Same function, different this ---
function whoAmI() {
  console.log("whoAmI this ->", this);
}
const obj0 = { name: "obj", whoAmI };
whoAmI();      // undefined (strict mode, bare call)
obj0.whoAmI(); // { name: 'obj', whoAmI: [Function: whoAmI] }

// --- 15.2 Default binding ---
function showThis() {
  console.log("default binding this ->", this);
}
showThis(); // undefined in strict mode

// --- 15.3 Implicit binding and losing it ---
const user = {
  name: "Ada",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
};
user.greet(); // Hi, I'm Ada

const greetFn = user.greet;
try {
  greetFn(); // this.name throws in strict mode because this is undefined
} catch (e) {
  console.log("bare call error:", e.constructor.name, "-", e.message);
}

function invokeLater(fn) {
  fn();
}
try {
  invokeLater(user.greet);
} catch (e) {
  console.log("callback loses this:", e.constructor.name);
}

// --- 15.4 Explicit binding: call / apply / bind ---
function introduce(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}
const ada = { name: "Ada Lovelace" };
const grace = { name: "Grace Hopper" };

introduce.call(ada, "Hello");
introduce.apply(grace, ["Hi"]);

const introduceAda = introduce.bind(ada);
introduceAda("Hey");
introduceAda.call(grace, "Yo"); // still Ada -- bind wins

// --- fix with bind ---
const timerFixed = {
  seconds: 0,
  start() {
    return new Promise((resolve) => {
      const id = setInterval(
        function () {
          this.seconds++;
          console.log("timerFixed.seconds:", this.seconds);
          if (this.seconds >= 2) {
            clearInterval(id);
            resolve();
          }
        }.bind(this),
        50
      );
    });
  },
};

// --- 15.5 new binding ---
function Person(name) {
  this.name = name;
}
const p1 = new Person("Ada");
const p2 = new Person("Grace");
console.log(p1.name, p2.name);

// --- 15.6 Rule priority: new/explicit/implicit/default ---
function show() {
  console.log("priority this.label ->", this.label);
}
const bound = show.bind({ label: "bound object" });
const objPriority = { label: "obj", show: bound };
objPriority.show(); // "bound object" -- explicit beats implicit

// --- 15.7 Arrow functions and lexical this ---
const user2 = {
  name: "Ada",
  greetArrow: () => {
    console.log("arrow this.name ->", this?.name);
  },
  greetRegular() {
    console.log("regular this.name ->", this.name);
  },
};
user2.greetArrow();
user2.greetRegular();

const timerArrow = {
  seconds: 0,
  start() {
    return new Promise((resolve) => {
      const id = setInterval(() => {
        this.seconds++;
        console.log("timerArrow.seconds:", this.seconds);
        if (this.seconds >= 2) {
          clearInterval(id);
          resolve();
        }
      }, 50);
    });
  },
};

// --- 15.8 this inside classes ---
class Button {
  constructor(label) {
    this.label = label;
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log(`${this.label} clicked`);
  }
}
const btn = new Button("Submit");
const detachedClick = btn.handleClick;
detachedClick(); // still works because it was bound in the constructor

class ButtonFieldArrow {
  label;
  constructor(label) {
    this.label = label;
  }
  handleClick = () => {
    console.log(`${this.label} (field-arrow) clicked`);
  };
}
const btn2 = new ButtonFieldArrow("Cancel");
const detachedClick2 = btn2.handleClick;
detachedClick2(); // works: arrow field captured instance this

// run the two timer demos sequentially so output stays readable
(async () => {
  await timerFixed.start();
  await timerArrow.start();
})();
