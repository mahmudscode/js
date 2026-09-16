// Chapter 20 — Iterators and Generators
// Run with: node examples/20-iterators-generators.js

// --- 20.1 The iterator protocol ---
const numbers = [10, 20, 30];
const iterator = numbers[Symbol.iterator]();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());

const it = numbers[Symbol.iterator]();
let result = it.next();
while (!result.done) {
  console.log("manual for...of:", result.value);
  result = it.next();
}

// --- 20.2 Custom iterable ---
class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }
  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current < end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}
const range = new Range(1, 10, 2);
for (const n of range) {
  console.log("range:", n);
}
console.log([...range]);
const [first, second] = range;
console.log(first, second);

// --- 20.3 Generator functions ---
function* rangeGenerator(start, end, step = 1) {
  for (let current = start; current < end; current += step) {
    yield current;
  }
}
const gen = rangeGenerator(1, 10, 2);
console.log(gen.next());
console.log(gen.next());
for (const n of rangeGenerator(1, 10, 2)) {
  console.log("gen for...of:", n);
}
console.log([...rangeGenerator(1, 6)]);

function* conversation() {
  const name = yield "What's your name?";
  const mood = yield `Hi ${name}, how are you?`;
  return `${name} said they are ${mood}.`;
}
const convo = conversation();
console.log(convo.next());
console.log(convo.next("Ada"));
console.log(convo.next("curious"));

// --- 20.4 Lazy, infinite sequences ---
function* naturalNumbers() {
  let n = 1;
  while (true) {
    yield n++;
  }
}
function take(iterable, count) {
  const result = [];
  const iter = iterable[Symbol.iterator]();
  for (let i = 0; i < count; i++) {
    result.push(iter.next().value);
  }
  return result;
}
console.log(take(naturalNumbers(), 5));

function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
console.log(take(fibonacci(), 8));

// --- 20.5 yield* delegation ---
function* letters() {
  yield "a";
  yield "b";
}
function* numbers2() {
  yield 1;
  yield 2;
}
function* combined() {
  yield* letters();
  yield* numbers2();
  yield "done";
}
console.log([...combined()]);

function* flattenOneLevel(arrayOfArrays) {
  for (const arr of arrayOfArrays) {
    yield* arr;
  }
}
console.log([...flattenOneLevel([[1, 2], [3, 4], [5]])]);

// --- 20.6 Custom linked-list iterator ---
class LinkedList {
  #head = null;
  #tail = null;
  push(value) {
    const node = { value, next: null };
    if (!this.#head) {
      this.#head = node;
      this.#tail = node;
    } else {
      this.#tail.next = node;
      this.#tail = node;
    }
    return this;
  }
  *[Symbol.iterator]() {
    let current = this.#head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}
const list = new LinkedList().push(1).push(2).push(3);
console.log([...list]);
for (const value of list) {
  console.log("linked list:", value);
}

// --- 20.7 Async generators preview ---
async function* fetchPagesLazily(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    const data = await Promise.resolve(`page ${page} data`);
    yield data;
  }
}

// --- Exercise solutions ---
function* evenNumbers(limit) {
  for (let n = 0; n < limit; n += 2) {
    yield n;
  }
}
console.log([...evenNumbers(10)]);
console.log(take(fibonacci(), 10));

class Stack {
  #items = [];
  push(item) {
    this.#items.push(item);
    return this;
  }
  pop() {
    return this.#items.pop();
  }
  *[Symbol.iterator]() {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      yield this.#items[i];
    }
  }
}
const stack = new Stack().push(1).push(2).push(3);
console.log([...stack]); // top to bottom: [3, 2, 1]
console.log(stack.pop()); // stack unaffected by iteration -> still pops 3

(async () => {
  for await (const pageData of fetchPagesLazily(3)) {
    console.log(pageData);
  }
})();
