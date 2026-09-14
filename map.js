const numbers = [1, 2, 3, 4, 5];

// const double =[];
// for (const num of numbers) {
//     const doublel = num * 2;
//     double.push(doublel);
// }
// console.log(double); // Output: [2, 4, 6, 8, 10]

function doubleit(num) {
    return num * 2;
}

const result = numbers.map(doubleit);
console.log(result); // Output: [2, 4, 6, 8, 10]
