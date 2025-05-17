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

> **Note**: This tool currently works only with Yarn.

## Installation

Install via npm:

```sh
npm install @wroud/ci
```

Install via yarn

```sh
yarn add @wroud/ci
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Configuration

Create an optional `wroud.ci.config.js` in the project root:

```js
export default {
  repository: "owner/repo",
  tagPrefix: "v",
};
```

`repository` is used to generate links in the changelog. If omitted, `GITHUB_REPOSITORY` or the `repository.url` field from `package.json` is used. `tagPrefix` sets the prefix for git tags. It can also be provided via the `TAG_PREFIX` environment variable or the `tagPrefix` field in `package.json`.

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

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "ci:release": "ci release",
    "ci:git-tag": "ci git-tag",
    "ci:release-github": "ci release-github"
  }
}
```

## Workspace with Multiple Packages

Run the commands for each package using `yarn workspaces foreach`:

```sh
yarn workspaces foreach -A --topological-dev run ci:release
```

## Example Workflow

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
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'yarn'
      - run: yarn install --immutable
      - run: yarn build
      - run: npx @wroud/ci release-github
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
