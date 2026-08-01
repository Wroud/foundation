# Conventions

- Commit messages & PR titles: Conventional Commits (enforced by commitlint; drives per-package semver via @wroud/ci).
- Tests live next to sources as `*.test.ts(x)` inside `src/`; excluded from npm `files` globs.
- Packages export from `lib/` only (`"./*": "./lib/*.js"`); keep `exports` map in package.json in sync when adding entry points. Conditional exports used where needed (e.g. `react-server` condition in vite-plugin-ssg).
- `sideEffects: []` in package.json by default.
- Add/update tests for any code changed; all tests must pass before merging.
- @wroud/docs has no tests — never run tests there; build all packages first (`yarn build`) before building docs.
- Prettier is the only formatter; no eslint config at root.