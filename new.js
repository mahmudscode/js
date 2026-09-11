/**
 * Data Structures Project in JavaScript
 * Includes: Arrays, Objects, Linked Lists, Stacks, Queues, Trees
 */

// ============ ARRAYS ============
console.log("=== ARRAYS ===");

const arr = [1, 2, 3, 4, 5];
arr.push(6); // Add to end
arr.pop(); // Remove from end
arr.unshift(0); // Add to beginning
arr.shift(); // Remove from beginning
arr.slice(1, 3); // Get elements 1-3
arr.map(x => x * 2); // Transform each element
arr.filter(x => x > 2); // Filter elements
arr.reduce((sum, x) => sum + x, 0); // Reduce to single value
console.log("Array operations done");

// ============ OBJECTS ============
console.log("=== OBJECTS ===");

const person = {
  name: "John",
  age: 30,
  city: "NYC",
  greet: function() {
    return `Hi, I'm ${this.name}`;
  }
};

console.log(person.name);
console.log(Object.keys(person));
console.log(Object.values(person));
console.log(person.greet());

// ============ LINKED LIST ============
console.log("=== LINKED LIST ===");

class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  append(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }

  display() {
    let current = this.head;
    let result = "";
    while (current) {
      result += current.data + " -> ";
      current = current.next;
    }
    result += "null";
    console.log(result);
  }
}

const list = new LinkedList();
list.append(10);
list.append(20);
list.append(30);
list.display(); // 10 -> 20 -> 30 -> null

// ============ STACK ============
console.log("=== STACK ===");

class Stack {
  constructor() {
    this.items = [];
  }

  push(element) {
    this.items.push(element);
  }

  pop() {
    return this.items.pop();
  }

  peek() {
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  print() {
    console.log(this.items.toString());
  }
}

const stack = new Stack();
stack.push(10);
stack.push(20);
stack.push(30);
stack.print(); // 10,20,30
console.log("Popped:", stack.pop()); // 30

// ============ QUEUE ============
console.log("=== QUEUE ===");

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    return this.items.shift();
  }

  front() {
    return this.items[0];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  print() {
    console.log(this.items.toString());
  }
}

const queue = new Queue();
queue.enqueue(10);
queue.enqueue(20);
queue.enqueue(30);
queue.print(); // 10,20,30
console.log("Dequeued:", queue.dequeue()); // 10

// ============ BINARY SEARCH TREE ============
console.log("=== BINARY SEARCH TREE ===");

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const newNode = new TreeNode(value);
    if (this.root === null) {
      this.root = newNode;
      return this;
    }
    let current = this.root;
    while (true) {
      if (value === current.value) return undefined;
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }

  search(value) {
    let current = this.root;
    while (current !== null) {
      if (value === current.value) return true;
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    return false;
  }

  inOrder(node = this.root, result = []) {
    if (node !== null) {
      this.inOrder(node.left, result);
      result.push(node.value);
      this.inOrder(node.right, result);
    }
    return result;
  }
}

const bst = new BinarySearchTree();
bst.insert(50);
bst.insert(30);
bst.insert(70);
bst.insert(20);
bst.insert(40);
bst.insert(60);
bst.insert(80);

console.log("In-order traversal:", bst.inOrder());
console.log("Search 40:", bst.search(40)); // true
console.log("Search 100:", bst.search(100)); // false

// ============ HASH TABLE ============
console.log("=== HASH TABLE ===");

class HashTable {
  constructor(size = 50) {
    this.size = size;
    this.table = new Array(size);
  }

  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    return hash % this.size;
  }

  set(key, value) {
    const index = this.hash(key);
    if (!this.table[index]) {
      this.table[index] = [];
    }
    this.table[index].push([key, value]);
  }

  get(key) {
    const index = this.hash(key);
    if (this.table[index]) {
      for (let pair of this.table[index]) {
        if (pair[0] === key) {
          return pair[1];
        }
      }
    }
    return undefined;
  }
}

const hashTable = new HashTable();
hashTable.set("name", "John");
hashTable.set("age", 30);
console.log("Get name:", hashTable.get("name")); // John
console.log("Get age:", hashTable.get("age")); // 30

console.log("=== Data Structures Project Complete ===");
