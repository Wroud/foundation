# Tech stack

- Language: TypeScript ^6 (compiled with `tsc -b` project references, output `lib/`), pure ESM.
- Package manager: Yarn 4 (Berry) workspaces (`packages/*`, `packages/@wroud/*`). Root pins `yarn@4.14.1`.
- Tests: Vitest ^3 wrapped by `@wroud/tests-runner` (workspace package); coverage via `@vitest/coverage-v8`; DOM via happy-dom / @testing-library/dom.
- React ^19, Vite ^8 (vite-plugin-ssg uses RSC / react-server export conditions, rolldown as dev dep).
- Formatting: Prettier ^3. Commit hygiene: husky + commitlint (@commitlint/config-conventional).
- Release tooling is self-hosted: `@wroud/ci` + conventional-commits-* packages from this repo.