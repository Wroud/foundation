# Contributor Guide

## Dev Environment Tips
- Use `yarn workspaces list` to list packages instead of scanning with ls.
- Run `yarn workspace <project_name> add` to add the package to your workspace so Vite, ESLint, and TypeScript can see it.
- To create a new package create folder in `packages` or `packages/@wroud` folder with name of the package, from this folder use `yarn tst project` to spin up a new typescript project, you can update `extends` field in the tsconfig.json to any config from `packages/@wroud/tsconfig` depending on type of the project. Add new project as a dev dependency to the `@wroud/_aggregate` project.
- Check the name field inside each package's package.json to confirm the right name—skip the top-level one.

## Testing Instructions
- Find the CI plan in the .github/workflows folder.
- Run `yarn workspace <project_name> build` to build sources for that package.
- Run `yarn workspace <project_name> test run` to run every check defined for that package.
- From the package root you can just call `yarn build` and after `yarn test run`. The commit should pass all tests before you merge.
- Always run sources build before running tests.
- To focus on one step, add the Vitest pattern: `yarn test run -t "<test name>"`.
- Fix any test or type errors until the whole suite is green.
- After moving files or changing imports, `yarn workspace <project_name> build` to be sure TypeScript rules still pass.
- Add or update tests for the code you change, even if nobody asked.
- Keep formatting using `yarn prettier <path_to_file> --write`.

## PR instructions
Title format: conventional commits format

## General instructions
- Ignore files and folders presented in .gitignore
- Always ensure that tests passed before finishing task
- Commit messages and PR titles should follow conventional commits format
