# Chapter 31 — npm and Package Management

## 31.1 What npm is

npm ("Node Package Manager") is three things bundled under one name:

1. **A command-line tool** (`npm`) installed alongside Node.js, used to
   install, update, and manage dependencies.
2. **A public registry** at npmjs.com hosting well over two million
   packages — reusable pieces of JavaScript anyone can publish and anyone
   can install.
3. **A file format**, `package.json`, that describes a project's metadata,
   scripts, and dependencies in a way both humans and tools can read.

Without a package manager, using a third-party library meant manually
downloading a `.js` file and dropping it into your project — no version
tracking, no dependency resolution, no easy updates. npm (and its
alternatives) solved that problem for the entire JavaScript ecosystem.

## 31.2 Anatomy of `package.json`

Every npm-managed project has a `package.json` at its root. Here's what the
common fields mean (see `examples/31-npm-and-package-management/package.json`
for a full working example, and its neighboring `README.md` for a
field-by-field walkthrough since JSON has no comment syntax):

```json
{
  "name": "my-app",
  "version": "1.2.0",
  "description": "A short description of the package.",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "eslint": "^9.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- **`name`** / **`version`** — required if you intend to publish; version
  must follow semantic versioning (next section).
- **`main`** — the entry file `require("my-app")` resolves to (CommonJS).
  For ESM projects, `exports` is the modern replacement, allowing a package
  to expose multiple, explicitly defined entry points.
- **`type`** — `"module"` makes `.js` files in this package ECMAScript
  Modules (`import`/`export`); omitted or `"commonjs"` keeps `require`.
- **`scripts`** — named shell commands runnable via `npm run <name>`.
  `start`, `test`, `build`, and a few others get a shorthand (`npm start`,
  `npm test`) without needing `run`.
- **`dependencies`** — packages required at runtime, in production.
- **`devDependencies`** — packages only needed while developing (test
  runners, linters, bundlers) — not installed when a consumer of *your*
  package installs it, but installed when *you* run `npm install` in this
  repo.
- **`peerDependencies`** — "this package expects the *consumer's* project
  to already have a compatible version of X installed" — common for plugins
  (a React component library declares `react` as a peer dependency rather
  than bundling its own copy).
- **`engines`** — documents (and can be enforced to require) a minimum
  Node.js version.

## 31.3 Semantic versioning (SemVer)

Package versions follow `MAJOR.MINOR.PATCH`, e.g. `4.19.2`:

- **MAJOR** — incremented for breaking changes (`3.x` → `4.0.0`).
- **MINOR** — incremented for backward-compatible new features (`4.18.x` →
  `4.19.0`).
- **PATCH** — incremented for backward-compatible bug fixes (`4.19.1` →
  `4.19.2`).

In `package.json`, version ranges use prefixes to say how much automatic
updating is allowed:

| Prefix | Meaning | Example allows |
|---|---|---|
| `^4.19.2` | Compatible within the same major version | `4.19.3`, `4.20.0`, not `5.0.0` |
| `~4.19.2` | Compatible within the same minor version | `4.19.3`, not `4.20.0` |
| `4.19.2` | Exact version only | only `4.19.2` |
| `*` or `latest` | Any version | anything (avoid in real projects) |

`^` (caret) is the npm default and the most common choice — it trusts the
package author's SemVer promise that minor/patch releases won't break your
code. That trust is sometimes violated, which is exactly why lockfiles
exist.

## 31.4 `package-lock.json` and reproducible installs

`package.json` describes *acceptable ranges*; `package-lock.json` records
the **exact** version of every package (and every dependency of every
dependency) that was actually installed, down to the exact download URL and
integrity hash. Two developers running `npm install` against the same
`package.json` could, in theory, get different transitive dependency
versions if a sub-dependency published a new minor release between their
installs — the lockfile eliminates that non-determinism.

**Always commit `package-lock.json` to version control.** It's what makes
"works on my machine" reproducible on your teammate's machine and in CI.

## 31.5 Core commands

```bash
npm install              # install everything in package.json (writes/updates the lockfile)
npm install express      # add express to dependencies, install it
npm install -D eslint    # add eslint to devDependencies (-D / --save-dev)
npm install -g nodemon   # install globally (available as a CLI command everywhere)
npm uninstall express    # remove a dependency
npm update               # update packages within their allowed SemVer ranges
npm run build            # run the "build" script from package.json
npm start                # shorthand for `npm run start`
npm test                 # shorthand for `npm run test`
npm ci                   # "clean install" — strictly follows the lockfile, used in CI
```

`npm ci` deletes `node_modules` first and installs *exactly* what
`package-lock.json` specifies, failing loudly if `package.json` and the
lockfile disagree. It's faster and safer than `npm install` for automated
environments (CI pipelines, Docker builds) precisely because it refuses to
silently resolve new versions.

## 31.6 `npx`: running packages without installing them globally

`npx` (bundled with npm since v5.2) runs a package's CLI binary, installing
a temporary copy if it isn't already available locally — useful for
one-off tool usage without polluting your global install list:

```bash
npx create-react-app my-app
npx cowsay "Hello!"
```

If the package is already listed in your project's `devDependencies`,
`npx <command>` will run the local copy from `node_modules/.bin` instead of
downloading anything, which is the more common real-world use: running
locally-installed CLI tools (`npx eslint .`, `npx tsc`) without needing
them on your system `PATH`.

## 31.7 Alternative package managers: Yarn and pnpm

npm isn't the only option compatible with the `package.json`/npm registry
ecosystem:

- **Yarn** (2016, Facebook) — originally created to fix npm's
  reliability and speed problems at the time (most have since been fixed
  in npm itself). Yarn 1 is largely npm-compatible; Yarn Berry (2+)
  introduced its own architecture, including "Plug'n'Play" mode that skips
  `node_modules` entirely.
- **pnpm** — its main selling point is disk efficiency: instead of copying
  every package into every project's `node_modules` (npm/Yarn's
  historical approach), pnpm keeps one global content-addressable store on
  disk and uses hard links/symlinks per project, saving significant space
  when you have many projects. It also enforces stricter dependency
  isolation (a package can't accidentally `require` a dependency it never
  declared, a common class of bug called "phantom dependencies").

Both Yarn and pnpm have first-class **workspaces** support — managing
multiple related packages (a "monorepo") from one repository root, sharing
a single lockfile and hoisted dependencies. npm added workspaces support
in v7+ as well. Choosing between them is mostly a team/tooling preference
today; the concepts in this chapter (SemVer, lockfiles, `dependencies` vs
`devDependencies`) apply to all three.

## 31.8 Publishing a package (conceptual overview)

Publishing your own package to the npm registry, at a high level:

1. Create a `package.json` with a unique `name` (or a scoped name like
   `@yourusername/package-name` to avoid collisions) and a starting
   `version` (conventionally `1.0.0` or `0.1.0`).
2. Run `npm login` once to authenticate the CLI with your npm account.
3. Run `npm publish` from the package root. npm uploads everything not
   excluded by `.npmignore` (or, if absent, `.gitignore`) or the `files`
   field in `package.json`.
4. For subsequent releases, bump the version (`npm version patch|minor|
   major`, which also updates `package.json` and creates a git tag) and
   `npm publish` again — npm will not let you re-publish the same version
   number, which is a deliberate safeguard for reproducibility.

This book doesn't walk through publishing hands-on since it requires a
registry account, but the mental model above covers what happens when you
`npm install` any public package: someone ran exactly this process.

## 31.9 Security: supply-chain awareness

Every `dependency` you add is code you did not write, running with the
same permissions as your own code — including transitive dependencies you
never explicitly chose. A few practical habits:

- **`npm audit`** scans your installed dependency tree against a database
  of known vulnerabilities and reports affected packages, often with a
  suggested fix version (`npm audit fix`).
- **Be deliberate about new dependencies.** Before installing a package for
  a small task, consider whether a few lines of your own code (or a
  built-in like `fs`, `crypto`, or `Array` methods) would do the job
  without adding a new piece of the supply chain to trust.
- **`postinstall` scripts** are arbitrary shell commands a package can run
  automatically the moment it's installed — this has been the entry point
  for real supply-chain attacks (a compromised or typo-squatted package
  exfiltrating environment variables during `npm install`, before you've
  even imported it). Review unfamiliar packages, especially ones with
  install scripts, before adding them to a project with real secrets in
  its environment.
- **Pin and review lockfile diffs.** A lockfile diff that changes far more
  packages than you'd expect from the one dependency you just bumped is
  worth a second look before merging.

None of this means avoid npm packages — the ecosystem's size is one of
JavaScript's biggest practical advantages. It means treating "add a
dependency" as a decision with a real (if usually small) cost, not a free
action.

## 31.10 Chapter summary

- npm is a CLI, a public registry, and the `package.json` file format
  together.
- `dependencies` ship to production; `devDependencies` are for local
  tooling only; `peerDependencies` declare an expectation on the consumer's
  own install.
- SemVer (`MAJOR.MINOR.PATCH`) with `^`/`~` range prefixes controls how
  much a version is allowed to drift on install/update.
- `package-lock.json` pins exact versions for reproducibility — always
  commit it; use `npm ci` in CI/automated environments.
- `npx` runs a package's CLI without a permanent global install.
- Yarn and pnpm are npm-compatible alternatives; pnpm in particular
  optimizes disk usage and dependency isolation.
- Treat every new dependency as a small trust decision; use `npm audit` and
  review lockfile diffs.

## 31.11 Exercises

1. Read `examples/31-npm-and-package-management/package.json` and its
   `README.md`, then write, by hand, what version range `^2.1.0` vs
   `~2.1.0` would each allow between `2.0.0` and `3.0.0`.
2. Without running `npm install`, explain in your own words the difference
   in what happens on your machine when a teammate runs `npm install`
   versus `npm ci` right after cloning a repository.
3. Find (by reading, not installing) one real npm package's `package.json`
   on npmjs.com and identify its `dependencies`, `devDependencies`, and any
   `peerDependencies`.
