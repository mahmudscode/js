# Chapter 12 — Dates and Time

## 12.1 The `Date` object

JavaScript's built-in `Date` object represents a single moment in time,
stored internally as the number of milliseconds since the **Unix epoch**
(midnight, January 1, 1970, UTC). Every `Date` you create, no matter how
you construct it, boils down to this one timestamp number.

```js
const now = new Date();
console.log(now);              // e.g. 2026-09-16T10:30:00.000Z
console.log(now.getTime());     // e.g. 1789554600000 — ms since epoch
console.log(Date.now());         // the same kind of number, without
                                  // needing to construct a Date object —
                                  // prefer this for simple timestamps
```

## 12.2 Creating dates: the many constructor forms

```js
new Date();                              // now
new Date(1789554600000);                  // from an epoch millisecond timestamp
new Date("2026-09-16");                    // from an ISO 8601 date string
                                            // (parsed as UTC midnight)
new Date("2026-09-16T10:30:00");            // ISO string with time
                                             // (parsed as LOCAL time,
                                             // because there's no 'Z'!)
new Date("2026-09-16T10:30:00Z");            // ISO string with explicit UTC
new Date(2026, 8, 16);                        // year, month (0-indexed!),
                                               // day — MONTH IS ZERO-BASED,
                                               // a classic gotcha (8 = Sept)
new Date(2026, 8, 16, 10, 30, 0);              // + hours, minutes, seconds
```

**The two biggest `Date` gotchas to memorize immediately:**

1. **Months are zero-indexed** (`0` = January, `11` = December) — `new
   Date(2026, 0, 1)` is January 1st, not February.
2. **`new Date("2026-09-16")`** (date-only ISO string) parses as **UTC
   midnight**, while **`new Date("2026-09-16T00:00:00")`** (with an
   explicit time but no `Z`/offset) parses as **local time midnight**.
   Depending on your timezone, these can represent different actual
   moments and even display as different calendar days when formatted.

## 12.3 Getting and setting date components

```js
const d = new Date(2026, 8, 16, 14, 30, 45);

d.getFullYear();   // 2026
d.getMonth();        // 8 (September, zero-indexed — NEVER use getYear(),
                      // a deprecated, non-Y2K-safe method)
d.getDate();           // 16 (day of the month, 1-31)
d.getDay();              // day of the WEEK, 0 (Sunday) - 6 (Saturday)
d.getHours();             // 14
d.getMinutes();            // 30
d.getSeconds();             // 45
d.getMilliseconds();         // 0
d.getTimezoneOffset();        // minutes behind/ahead of UTC (sign flipped —
                               // e.g. UTC-5 reports as +300)

// Setters mutate the Date object in place
d.setFullYear(2027);
d.setMonth(0);          // change to January
d.setDate(1);             // change to the 1st

// getUTC* variants read the SAME instant in UTC, ignoring local timezone
d.getUTCHours();
```

## 12.4 Date arithmetic

`Date` has no built-in "add days" method — you work with the underlying
millisecond timestamp, or manipulate components directly (JavaScript
auto-normalizes overflowing values, e.g. day 32 rolls into the next month):

```js
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result; // handles month/year rollover automatically
}

const today = new Date(2026, 8, 30); // Sept 30, 2026
console.log(addDays(today, 5)); // Oct 5, 2026 — rolled into next month correctly

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}
console.log(daysBetween(new Date(2026, 0, 1), new Date(2026, 11, 31))); // 364
```

Adding months/years by simply calling `setMonth(getMonth() + 1)` can
produce surprising results near month boundaries — e.g. adding one month
to January 31st "overflows" into March 3rd (because February doesn't have
31 days), which is exactly why serious date-arithmetic needs are usually
handled by a library rather than hand-rolled code (§12.6).

## 12.5 Formatting dates

```js
const d = new Date(2026, 8, 16, 14, 30, 0);

d.toISOString();     // "2026-09-16T18:30:00.000Z" (always UTC, machine-
                       // readable — use this for APIs and storage)
d.toDateString();      // "Wed Sep 16 2026"
d.toLocaleDateString(); // "9/16/2026" (format varies by locale!)
d.toLocaleTimeString();  // "2:30:00 PM"
d.toLocaleString();       // "9/16/2026, 2:30:00 PM"

// Intl.DateTimeFormat gives full control over locale-aware formatting
new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(d);
// "Wednesday, September 16, 2026"

new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(d);
// "mercredi 16 septembre 2026"
```

**For storage and APIs, always use `toISOString()`** (or store the raw
epoch number) — never a locale-formatted string, which is ambiguous
(is `9/16/2026` September 16th or the 9th day of month 16?) and impossible
to reliably parse back.

## 12.6 Timezones, and Date's honest design flaws

`Date` has two "modes" baked in that constantly trip people up: some
methods operate in the browser/Node process's **local timezone**
(`getHours`, `toLocaleDateString`, the `new Date(y, m, d)` constructor),
while others operate in **UTC** (`getUTCHours`, `toISOString`). Mixing
them without realizing it is one of the most common sources of
"off-by-one-day" bugs in real applications, especially for teams
distributed across timezones or users traveling across them.

`Date` is also, by wide consensus among JS developers, a genuinely awkward
API: it's mutable (setters modify in place, unlike almost every other
built-in), month indexing is zero-based while day-of-month is one-based
(inconsistent), and there's no built-in duration type. For anything beyond
simple formatting and arithmetic, most production codebases reach for a
library:

- **date-fns** — a collection of small, tree-shakeable pure functions
  (`addDays`, `differenceInDays`, `format`) — a popular modern default.
- **Day.js** — a tiny (~2KB) Moment.js-compatible API with a plugin system.
- **Luxon** — built by a Moment.js maintainer, with first-class timezone
  and `Intl` support.
- **Moment.js** — historically dominant, but now in official maintenance
  mode; the docs themselves recommend newer alternatives for new projects.

For learning and for genuinely simple needs (log timestamps, basic date
math), the native `Date` and `Intl` APIs covered in this chapter are
enough — reach for a library once you're doing serious timezone-aware
scheduling, recurring events, or duration math.

## 12.7 Chapter summary

- `Date` stores a single instant as milliseconds since the Unix epoch;
  `Date.now()` gets that number directly without an object.
- Two critical gotchas: **months are zero-indexed**, and a date-only ISO
  string parses as UTC while a datetime string without an offset parses as
  local time.
- There's no built-in "add days" — mutate a copy's components with
  `setDate`/`setMonth`/etc., which auto-normalizes overflow.
- Use `toISOString()` for storage/APIs; use `Intl.DateTimeFormat` for
  locale-aware display to users.
- `Date`'s API has real, acknowledged design flaws (mutability,
  inconsistent indexing) — reach for date-fns, Day.js, or Luxon once your
  date-handling needs get non-trivial (recurring events, real timezone
  math).

## 12.8 Exercises

1. Write `isLeapYear(year)` using `Date`'s auto-normalizing behavior:
   construct `new Date(year, 1, 29)` and check whether `getMonth()` still
   reports February (1) or has rolled into March (2).
2. Explain, in your own words, why `new Date("2026-01-01")` and
   `new Date("2026-01-01T00:00:00")` can represent different moments in
   time depending on the machine's timezone.
3. Write `formatFriendly(date)` that returns something like "September 16,
   2026" using `Intl.DateTimeFormat`.
