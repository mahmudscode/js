# Chapter 5 — Control Flow

## 5.1 `if` / `else if` / `else`

```js
const hour = 14;

if (hour < 12) {
  console.log("Good morning");
} else if (hour < 18) {
  console.log("Good afternoon");
} else {
  console.log("Good evening");
}
```

Conditions are evaluated for **truthiness**, not just booleans (see 5.3),
so any value can appear in an `if`:

```js
const username = "";
if (username) {
  console.log(`Hello, ${username}`);
} else {
  console.log("No username provided"); // runs, because "" is falsy
}
```

## 5.2 Guard clauses

A **guard clause** exits a function early for invalid or edge-case input,
avoiding deep nesting. This is widely considered better style than
wrapping the "happy path" in a big `if`:

```js
// Nested style — harder to read as conditions grow
function processOrderNested(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.paid) {
        return "Processing order";
      } else {
        return "Order not paid";
      }
    } else {
      return "Empty order";
    }
  } else {
    return "No order provided";
  }
}

// Guard clause style — flat, reads top-to-bottom
function processOrder(order) {
  if (!order) return "No order provided";
  if (order.items.length === 0) return "Empty order";
  if (!order.paid) return "Order not paid";

  return "Processing order";
}
```

## 5.3 Truthy and falsy values

JavaScript coerces any value used in a boolean context (`if`, `&&`, `||`,
`!`, ternary conditions) to `true` or `false`. There are exactly **eight**
falsy values — everything else is truthy:

```
false
0
-0
0n            (BigInt zero)
""            (empty string)
null
undefined
NaN
```

Everything else — including `"0"` (a non-empty string!), `[]` (an empty
array!), and `{}` (an empty object!) — is **truthy**:

```js
if ("0") console.log("truthy: the string \"0\""); // runs
if ([]) console.log("truthy: empty array");          // runs
if ({}) console.log("truthy: empty object");           // runs
if (" ") console.log("truthy: a string with just a space"); // runs
```

This trips up developers coming from languages where empty
arrays/objects are falsy. In JavaScript, **any object reference is always
truthy**, no matter what it contains.

## 5.4 `switch`

```js
const day = "TUE";

switch (day) {
  case "MON":
  case "TUE":
  case "WED":
  case "THU":
  case "FRI":
    console.log("Weekday");
    break;
  case "SAT":
  case "SUN":
    console.log("Weekend");
    break;
  default:
    console.log("Invalid day");
}
```

`switch` compares with **strict equality** (`===`), no coercion — so
`switch ("5") { case 5: ... }` will NOT match.

### The fallthrough trap

Without a `break`, execution **falls through** into the next case,
regardless of whether its condition matches. This is either a deliberate
tool (as with the grouped cases above) or a classic bug:

```js
function describe(n) {
  let result = "";
  switch (n) {
    case 1:
      result += "one ";
      // no break! falls through into case 2
    case 2:
      result += "two ";
      break;
    case 3:
      result += "three";
      break;
  }
  return result;
}
console.log(describe(1)); // "one two " -- probably not intended
console.log(describe(2)); // "two "
```

**Rule: always add `break` (or `return`) at the end of every case unless
the fallthrough is intentional and commented.** Many linters flag missing
`break` statements by default for exactly this reason.

## 5.5 `switch` vs. object lookup vs. `if`/`else if`

For simple "match a value, return a result" logic, an object literal used
as a lookup table is often clearer and avoids the fallthrough trap
entirely:

```js
const dayType = {
  MON: "Weekday", TUE: "Weekday", WED: "Weekday",
  THU: "Weekday", FRI: "Weekday",
  SAT: "Weekend", SUN: "Weekend",
};
console.log(dayType["TUE"] ?? "Invalid day"); // "Weekday"
```

Use `if`/`else if` when conditions involve ranges or multiple variables
(`switch` only compares one value); use `switch` when you have many exact
matches against a single value and want the branch grouping to read
clearly; use an object/`Map` lookup when the logic is a pure "input ->
output" mapping with no side effects per branch.

## 5.6 Ternary vs. `if`/`else`: style tradeoffs

```js
// Ternary — good for short, single-expression results assigned to a variable
const status = isActive ? "Active" : "Inactive";

// if/else — better when branches have multiple statements or side effects
let status2;
if (isActive) {
  logActivation();
  status2 = "Active";
} else {
  logDeactivation();
  status2 = "Inactive";
}
```

**Rule of thumb: use a ternary only when both branches are simple
expressions and the whole thing reads on roughly one line. Once you need
multiple statements, side effects, or nested ternaries, switch to
`if`/`else` for readability.** Nested ternaries in particular
(`a ? b : c ? d : e`) are a common code review complaint — more than one
level deep, most style guides prefer `if`/`else if` or a lookup table.

## 5.7 Common control-flow bugs

A handful of mistakes account for the vast majority of real-world
control-flow bugs. Recognizing them on sight is worth more than any
amount of theory:

```js
// BUG 1: assignment instead of comparison
let isReady = false;
// if (isReady = true) { ... }  // always runs! assigns true, then evaluates it as truthy
if (isReady === true) {
  console.log("ready");
}

// BUG 2: comparing against the wrong falsy-adjacent value
function processCount(count) {
  if (!count) {
    // WRONG if count === 0 is a valid, meaningful input — 0 is falsy!
    return "no count given";
  }
  return `count is ${count}`;
}
console.log(processCount(0)); // "no count given" -- probably a bug if 0 is valid data

function processCountFixed(count) {
  if (count === undefined || count === null) {
    return "no count given";
  }
  return `count is ${count}`;
}
console.log(processCountFixed(0)); // "count is 0" -- correct

// BUG 3: off-by-one in range checks
function isValidIndex(arr, index) {
  // return index >= 0 && index <= arr.length; // WRONG: allows arr.length, one past the end
  return index >= 0 && index < arr.length; // correct: last valid index is length - 1
}
console.log(isValidIndex([1, 2, 3], 3)); // false -- correctly rejects the out-of-bounds index

// BUG 4: forgetting that else-if chains stop at the first match
function categorize(score) {
  if (score >= 0) return "non-negative"; // matches EVERYTHING >= 0, including 95!
  if (score >= 90) return "excellent";    // unreachable — dead code
  return "other";
}
console.log(categorize(95)); // "non-negative" -- the intended "excellent" branch never runs
// Fix: order conditions from most specific to least specific
function categorizeFixed(score) {
  if (score >= 90) return "excellent";
  if (score >= 0) return "non-negative";
  return "other";
}
console.log(categorizeFixed(95)); // "excellent"
```

**Rule: when writing a chain of `if`/`else if` range checks, order the
conditions from most specific (narrowest range) to least specific
(widest range) — otherwise a broad early condition silently swallows
the cases meant for later branches.**

## 5.8 Multi-value comparisons without a long `||` chain

Comparing one value against several possibilities is common enough to
deserve its own idiom. The naive approach repeats the variable name for
every comparison:

```js
function isWeekendVerbose(day) {
  return day === "SAT" || day === "SUN";
}
```

For three or more values, `Array.prototype.includes()` is shorter and
scales better without repeating the variable:

```js
function isWeekend(day) {
  return ["SAT", "SUN"].includes(day);
}

function isVowel(char) {
  return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
}
console.log(isWeekend("SUN"), isVowel("E")); // true true
```

This reads as "is `day` one of these values?" directly, and adding a new
value to check against is a one-word edit to the array instead of adding
a whole new `||` clause. The tradeoff: `.includes()` allocates a new
array on every call, which matters only in extremely hot loops (Chapter
34) — for everyday code, prefer the version that reads most clearly.

## 5.9 Chapter summary

- `if` conditions coerce any value to boolean via truthy/falsy rules —
  memorize the eight falsy values: `false, 0, -0, 0n, "", null,
  undefined, NaN`. Everything else, including `[]` and `{}`, is truthy.
- Guard clauses (`if (!valid) return;`) flatten nested conditionals and
  are generally preferred over deep `if`/`else` nesting.
- `switch` uses strict equality and **falls through** without `break` —
  always terminate cases explicitly unless the fallthrough is
  intentional.
- For pure value-to-value mappings, an object or `Map` lookup is often
  clearer than `switch`.
- Use ternaries for short, single-expression conditionals; use `if`/`else`
  once branches need multiple statements or side effects.

## 5.10 Exercises

1. List which of these are truthy: `"false"`, `0`, `"0"`, `null`, `[]`,
   `NaN`, `-1`. Check your answers by running
   `examples/05-control-flow.js`.
2. Rewrite a `switch` statement that maps HTTP status codes 200, 201, 204
   to `"success"`, 400, 404 to `"client error"`, and 500 to `"server
   error"`, defaulting to `"unknown"`, as an object lookup instead.
3. Take the nested `processOrderNested` function from this chapter and
   rewrite it with guard clauses without looking at the example first.
