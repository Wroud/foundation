# Contributing to Wroud Foundation

Thank you for taking the time to contribute!

## Development workflow

- List available packages with `yarn workspaces list`.
- If you create a new package under `packages/` or `packages/@wroud/`, run `yarn tst project` from that folder and add it as a dev dependency to `@wroud/_aggregate`.
- After moving files or changing imports, run `yarn workspace <project_name> build` to ensure TypeScript rules pass.
- Build sources with `yarn build` and then run tests with `yarn test run`. You can scope the command to a workspace using `yarn workspace <project_name> build` and `yarn workspace <project_name> test run`.
- Fix any test or type errors until the whole suite is green.
- Keep formatting consistent using `yarn prettier <path_to_file> --write`.

## Commit messages and pull requests

- Use the [Conventional Commits](https://www.conventionalcommits.org) format for commit messages and PR titles.
- Ensure all tests pass before opening a pull request.

We appreciate your contributions!
