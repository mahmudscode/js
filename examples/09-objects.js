// Chapter 9 — Objects
// Run with: node examples/09-objects.js

// 9.1-9.3 Basics
const user = { name: "Ada", age: 36, isAdmin: true };
console.log("9.3 dot:", user.name);
const key = "age";
console.log("9.3 bracket:", user[key]);
user.age = 37;
user.email = "ada@example.com";
delete user.email;
console.log("9.3 after edits:", user);

// 9.4 Computed + shorthand
const field = "score";
const dynamicObj = { [field]: 100, [`${field}_bonus`]: 10 };
console.log("9.4 computed:", dynamicObj);

const name = "Grace";
const age = 45;
const person = { name, age };
console.log("9.4 shorthand:", person);

const calculator = {
  value: 0,
  add(n) {
    this.value += n;
    return this;
  },
};
calculator.add(5).add(10);
console.log("9.4 method shorthand chained:", calculator.value);

// 9.5 keys/values/entries
const scores = { alice: 90, bob: 85, cy: 95 };
console.log("9.5 keys:", Object.keys(scores));
console.log("9.5 values:", Object.values(scores));
console.log("9.5 entries:", Object.entries(scores));

for (const [n, s] of Object.entries(scores)) {
  console.log(`9.5 for..of entries: ${n}: ${s}`);
}

const doubled = Object.fromEntries(
  Object.entries(scores).map(([n, s]) => [n, s * 2])
);
console.log("9.5 fromEntries doubled:", doubled);

// 9.6 Copying and merging
const base = { a: 1, b: 2 };
const extra = { b: 20, c: 3 };
console.log("9.6 Object.assign merge:", Object.assign({}, base, extra));
console.log("9.6 spread merge:", { ...base, ...extra });
console.log("9.6 override with spread:", { ...base, b: 99 });

const original = { info: { city: "Lagos" } };
const shallowCopy = { ...original };
shallowCopy.info.city = "Nairobi";
console.log("9.6 shallow copy leaks nested mutation:", original.info.city);

const deepCopy = structuredClone(original);
deepCopy.info.city = "Accra";
console.log("9.6 structuredClone is a real deep copy:", original.info.city);

// 9.7 Freeze / seal
const config = { debug: true };
Object.freeze(config);
config.debug = false;
console.log("9.7 frozen (unchanged):", config.debug, Object.isFrozen(config));

const record = { id: 1 };
Object.seal(record);
record.id = 2;
record.extra = "no";
console.log("9.7 sealed (value changed, new prop ignored):", record);

// 9.8 in vs hasOwnProperty vs Object.hasOwn
const obj = { a: 1 };
console.log("9.8 'a' in obj:", "a" in obj);
console.log("9.8 'toString' in obj (inherited):", "toString" in obj);
console.log("9.8 hasOwnProperty toString:", obj.hasOwnProperty("toString"));
console.log("9.8 Object.hasOwn toString:", Object.hasOwn(obj, "toString"));

// 9.9 Getters/setters
const circle = {
  radius: 5,
  get area() {
    return Math.PI * this.radius ** 2;
  },
  set diameter(d) {
    this.radius = d / 2;
  },
};
console.log("9.9 circle.area:", circle.area.toFixed(2));
circle.diameter = 20;
console.log("9.9 radius after setting diameter:", circle.radius);

const p2 = { firstName: "Ada", lastName: "Lovelace" };
Object.defineProperty(p2, "fullName", {
  get() { return `${this.firstName} ${this.lastName}`; },
  set(value) { [this.firstName, this.lastName] = value.split(" "); },
  enumerable: true,
});
console.log("9.9 defineProperty getter:", p2.fullName);
p2.fullName = "Grace Hopper";
console.log("9.9 defineProperty setter effect:", p2.firstName, p2.lastName);

// 9.10 Map
const cache = new Map();
const objKey = { id: "obj-key" };
cache.set("user:1", { name: "Ada" });
cache.set(objKey, "works fine as a key, unlike with objects");
console.log("9.10 map get:", cache.get("user:1"));
console.log("9.10 map size:", cache.size);
for (const [k, v] of cache) {
  console.log("9.10 map entry:", k, "->", v);
}

// 9.11 Optional chaining
const response = { data: { user: null } };
console.log("9.11 optional chaining safe:", response.data.user?.name);
console.log("9.11 deep optional chaining:", response.data?.missing?.deeper?.field);
const displayName = response.data.user?.name ?? "Guest";
console.log("9.11 with nullish fallback:", displayName);
