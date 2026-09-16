# Example `package.json` — field by field

This folder is a teaching example for Chapter 31. It is **not meant to be
installed** — `express` and `eslint` are listed to illustrate the file
format, but running `npm install` here is unnecessary for the book (and
this repo intentionally avoids adding real external dependencies). You can
still run `index.js` directly, since it only uses Node.js built-ins:

```bash
node examples/31-npm-and-package-management/index.js
```

## Field-by-field

- **`name`** — the package's unique identifier on the npm registry (or
  just a local project name if never published). Must be lowercase, no
  spaces; can be scoped like `@yourname/package`.
- **`version`** — the current SemVer version. See Chapter 31, section 31.3.
- **`description`** — free text shown on the npm registry search results.
- **`main`** — the file `require("js-book-ch31-example")` would resolve to
  if this package were installed by another CommonJS project.
- **`type: "module"`** — tells Node.js to treat `.js` files in this
  package as ECMAScript Modules (`import`/`export` syntax) rather than
  CommonJS (`require`/`module.exports`). See Chapter 24.
- **`scripts`** — shell commands runnable with `npm run <name>`.
  `"start"` and `"test"` are special: `npm start` and `npm test` work
  without the word `run`.
- **`dependencies`** — packages required when this package actually runs
  in production. Would be downloaded into `node_modules` by `npm install`.
- **`devDependencies`** — packages only needed for local development
  (linters, test runners, bundlers). Skipped when *this* package is
  installed as someone else's dependency.
- **`peerDependencies`** — says "the project installing me is expected to
  already provide a compatible version of this package itself" — typical
  for plugins/extensions of a host library (a UI kit built for React
  declares `react` as a peer dependency instead of bundling its own copy).
- **`engines`** — documents the minimum supported Node.js version.
- **`license`** — the SPDX license identifier under which this code is
  distributed.

## Where `package-lock.json` fits in

If you *did* run `npm install` in a real version of this folder, npm would
generate a `package-lock.json` alongside `package.json`, recording the
exact resolved version (and every transitive dependency's exact version)
that was installed. That lockfile is what makes `npm ci` reproducible in
CI — see Chapter 31, section 31.4.
