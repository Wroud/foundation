---
applyTo: "**"
---

# Contributor Guide

## Dev Environment

- Use `yarn workspaces list` to list packages.
- Add a package: `yarn workspace <project> add <package>`.
- To create a package: make a folder in `packages` or `packages/@wroud`, run `yarn tst project` inside, update `tsconfig.json` pick correct extending config: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.react.json`, and add as a dev dependency to `@wroud/_aggregate`.
- Check the `name` in each package's `package.json` (ignore the top-level one).

## Testing

- CI plan: `.github/workflows`.
- After deleting/renaming tests or sources, run `yarn clear` before building.
- Build: `yarn workspace <project> build`.
- Test: `yarn workspace <project> test run`.
- Or from package root: `yarn build` then `yarn test run`.
- All tests must pass before merging.
- Always build before testing.
- Focus a test: `yarn test run -t "<test name>"`.
- Fix all test/type errors.
- After moving files or changing imports, rebuild to check TypeScript.
- Add/update tests for any code you change.
- Format: `yarn prettier <file> --write`.

## @wroud/docs

- Build all packages first: `yarn build` from root.
- Docs have no tests—do not run tests for docs.

## PRs

- PR titles: [Conventional Commits](https://www.conventionalcommits.org/) format.

## General

- Ignore files/folders in `.gitignore`.
- All tests must pass before finishing.
- Commit messages and PR titles: Conventional Commits format.
- If you see failing tests that do not exist, run `yarn clear` to remove old files.
