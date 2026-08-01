# Suggested commands (run from repo root unless noted)

- List packages: `yarn workspaces list`
- Build all: `yarn build` (delegates to `packages/_aggregate`, runs `tsc -b` over refs)
- Watch all: `yarn dev`
- Test all: `yarn test run` (tests-runner/vitest; `run` = non-watch)
- Per package: `yarn workspace @wroud/<name> build` / `yarn workspace @wroud/<name> test run`
- Focus one test: `yarn test run -t "<test name>"`
- Format: `yarn prettier <file> --write`
- Clean stale build output (after deleting/renaming source or test files, or when phantom failing tests appear): `yarn clear` (removes all lib/, node_modules, coverage) then rebuild
- Add dep: `yarn workspace <project> add <package>`
- New package: create folder under `packages/` or `packages/@wroud/`, run `yarn tst project` inside, pick extends in tsconfig.json (`tsconfig.json` | `tsconfig.node.json` | `tsconfig.react.json` from @wroud/tsconfig), add package to `@wroud/_aggregate` devDependencies

Never use `npx vitest` / `npx tsc` directly — always the yarn scripts above.
Darwin/zsh; standard unix commands otherwise.