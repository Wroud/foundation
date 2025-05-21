# @wroud/ci

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/ci.svg
[npm-url]: https://npmjs.com/package/@wroud/ci
[size]: https://packagephobia.com/badge?p=@wroud/ci
[size-url]: https://packagephobia.com/result?p=@wroud/ci

A small CLI for automating releases based on conventional commits. It bumps versions, updates your changelog and publishes GitHub releases.

> **Note**: This tool works with Yarn, npm and pnpm.

## Installation

Install via npm:

```sh
npm install --save-dev @wroud/ci
```

Install via yarn:

```sh
yarn add --dev @wroud/ci
```

Install via pnpm:

```sh
pnpm add -D @wroud/ci
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Configuration

`@wroud/ci` looks for an optional `wroud.ci.config.js` file located next to the `package.json` it relates to. A minimal configuration may look like:

```js
export default {
  repository: "owner/repo", // used for changelog links
  tagPrefix: "v",           // prefix for git tags
  packageManager: "npm",    // npm | yarn | pnpm
};
```

- `repository` is required when publishing GitHub releases. It can also be provided via the `repository.url` field in `package.json`.
- `tagPrefix` sets the prefix for git tags. It can alternatively be defined in `release.tagPrefix` inside `package.json`.
- `packageManager` is only needed if the package manager cannot be detected automatically. You can specify it here or via the `packageManager` field in `package.json`.

## Commands

### `release [path]`
Bump version and update changelog.
- `--prefix` tag prefix (defaults to configured prefix)
- `--change-log-file` path to changelog file
- `--dry-run` preview actions without writing files

### `git-tag`
Create git tag for current version.
- `--prefix` tag prefix (defaults to configured prefix)
- `--dry-run` preview actions

### `release-github`
Publish GitHub releases for new tags.
- `--prefix` tag prefix (defaults to configured prefix)
- `--dry-run` preview actions

## Single Package Repository

1. **Install** `@wroud/ci` as a dev dependency.
2. **Add scripts** to `package.json`:

```json
{
  "scripts": {
    "ci:release": "ci release",
    "ci:git-tag": "ci git-tag",
    "ci:release-github": "ci release-github" // optional
  }
}
```

3. **Configure** the repository URL and tag prefix in `package.json` or in a local `wroud.ci.config.js` file next to it.

4. **Example GitHub Action** (`.github/workflows/release.yml`):

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          registry-url: 'https://registry.npmjs.org'
          cache: 'yarn'
      - run: yarn install --immutable
      - run: yarn build
      - run: yarn ci:release
      - run: yarn ci:git-tag
      - run: git push --follow-tags
      - run: yarn ci:release-github
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Multiple Package Workspace

1. **Install** `@wroud/ci` in each package that should be released.
2. **Add scripts** to each package's `package.json` as shown above.
3. **Configure** a unique `tagPrefix` for every package using either `release.tagPrefix` in its `package.json` or an adjacent `wroud.ci.config.js` file. Ensure `repository.url` is set if GitHub releases are required.
4. **Example GitHub Action** for a monorepo:

```yaml
name: Release
on:
  push:
    tags:
      - '*'
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          registry-url: 'https://registry.npmjs.org'
          cache: 'yarn'
      - run: yarn install --immutable
      - run: yarn workspaces foreach -A --topological --no-private run ci:release
      - run: git commit -m "chore: release" && yarn workspaces foreach -A --no-private run ci:git-tag
      - run: git push --follow-tags
      - run: yarn workspaces foreach -A --no-private run ci:release-github
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: yarn workspaces foreach -A --topological --no-private npm publish --access public --tolerate-republish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
