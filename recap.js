/**
 * 1. ver let const
 * 2. default parameter 
 * 3. template string
 */

const a= 56;
const number =[56, 78, 90, 45, 23, 12];


const person = {
    name : 'John'
}
 
const massage = `hi , ${person.name} has a " ${a} access to ${number[2]} " `;

console.log(massage);

// Arrow Functions
const add = (x, y) => x + y;
console.log(add(5, 3)); // 8

const greet = name => `Hello, ${name}!`;
console.log(greet('John')); // Hello, John!

const sayHi = () => console.log('Hi there!');
sayHi(); // Hi there!