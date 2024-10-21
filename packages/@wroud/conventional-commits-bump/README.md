# @wroud/conventional-commits-bump

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/conventional-commits-bump.svg
[npm-url]: https://npmjs.com/package/@wroud/conventional-commits-bump
[size]: https://packagephobia.com/badge?p=@wroud/conventional-commits-bump
[size-url]: https://packagephobia.com/result?p=@wroud/conventional-commits-bump

`@wroud/conventional-commits-bump` is a utility designed to determine the appropriate version bump type based on conventional commits. This library helps automate the versioning process by analyzing commit messages and categorizing them as major, minor, or patch updates.

## Features

- **Version Bumping Logic**: Automatically determines the version bump type ("major", "minor", or "patch") based on commit types and breaking changes.
- **TypeScript Support**: Written in TypeScript for enhanced type safety and modern JavaScript features.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/conventional-commits-bump @wroud/conventional-commits-parser
```

## Usage

Use the `getConventionalCommitsBump` function to analyze an array of conventional commits and determine the appropriate version bump:

```ts
import type { IConventionalCommit } from "@wroud/conventional-commits-parser";
import { getConventionalCommitsBump } from "@wroud/conventional-commits-bump";

const commits: IConventionalCommit[] = [
  { type: "feat", breakingChanges: [] },
  { type: "fix", breakingChanges: [] },
];

const bump = getConventionalCommitsBump(commits);
console.log(bump); // Output: "minor"
```

## How does this relate to SemVer?

- `fix` type commits should be translated to **PATCH** releases.
- `feat` type commits should be translated to **MINOR** releases.
- Commits with **BREAKING CHANGE** in the commit messages, regardless of type, should be translated to **MAJOR** releases.

In this example, if any commit includes breaking changes, the bump will be "major". If there are no breaking changes but a commit of type "feat" is present, it will result in a "minor" bump; otherwise, it will return "patch" if there are any "fix" commits.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
