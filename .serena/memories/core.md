# Wroud Foundation — core map

Public monorepo (github.com/Wroud/foundation) of npm-published JS/TS tooling libraries under the `@wroud/*` scope.

## Layout
- `packages/@wroud/<name>` — main packages: di, di-react, navigation, flow-middleware, ci, git, github, conventional-commits-{parser,bump,changelog}, ts-template, ts-project-linker, tests-runner, tsconfig, vite-plugin-{ssg,tsc,asset-resolver,playground}, playground, playground-react, react-{tree,split-view,reactive-value}, preconditions, api-logger, docs, etc.
- `packages/<name>` — unscoped: graphql-codegen-fragment-masking, graphql-codegen-typed-document-nodes, yarn-plugin-ts-project-linker, test, playground-test.
- `packages/_aggregate` — private build orchestrator: `tsc -b` over project references; every package must be listed in its devDependencies to be built. Root `yarn build`/`yarn dev` just cd here.
- `packages/@wroud/tsconfig` — shared tsconfigs: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.react.json` (new packages extend one of these).
- `playground/` (root) — playground app; `vite-plugin-react/` (root, untracked) — vendored clone, not part of workspaces.

## Invariants
- Every package builds to `lib/` via `tsc -b`; `exports` maps point at `./lib/*.js`. Pure ESM (`"type": "module"`) everywhere.
- Releases are per-package via `@wroud/ci` with git tag prefixes like `vite-plugin-ssg-v` (`ci:release` scripts); versioning driven by Conventional Commits.
- CI: `.github/workflows` (build, test, release, docs, coverage).

Commands: `mem:suggested_commands`. Done-criteria for tasks: `mem:task_completion`. Stack/versions: `mem:tech_stack`. Code/commit conventions: `mem:conventions`.