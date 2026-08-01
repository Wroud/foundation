# Task completion checklist

1. Build first — always build before testing (tests depend on built project references): `yarn build` (root) or `yarn workspace @wroud/<name> build`.
2. Test: `yarn test run` (root) or `yarn workspace @wroud/<name> test run`. Fix ALL test and type errors.
3. If tests that shouldn't exist are failing (stale artifacts), `yarn clear` then rebuild.
4. After moving files / changing imports: rebuild to re-check TypeScript project references.
5. Format touched files: `yarn prettier <file> --write`.
6. Commit message in Conventional Commits format.