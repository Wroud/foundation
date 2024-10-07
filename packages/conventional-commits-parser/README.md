# @wroud/conventional-commits-parser

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://npmjs.com/package/@wroud/conventional-commits-parser
[npm]: https://img.shields.io/npm/v/@wroud/conventional-commits-parser.svg
[npm-url]: https://npmjs.com/package/@wroud/conventional-commits-parser
[size]: https://packagephobia.com/badge?p=@wroud/conventional-commits-parser
[size-url]: https://packagephobia.com/result?p=@wroud/conventional-commits-parser

`@wroud/conventional-commits-parser` is a lightweight library designed to parse conventional commit messages. It provides a structured way to extract commit types, scopes, and messages according to the conventional commits specification.

## Features

- **Conventional Commits Parsing**: Extract commit types, scopes, and messages.
- **TypeScript**: Written in TypeScript for type safety and modern JavaScript support.
- **ESM Package**: Pure ESM package for modern JavaScript environments.

## Installation

Install via npm:

```sh
npm install @wroud/conventional-commits-parser @wroud/git
```

## Usage

First, get `IGitCommitInfo` using `getGitCommits` from `@wroud/git`:

```ts
import { getGitCommits } from "@wroud/git";
import { parseConventionalCommit } from "@wroud/conventional-commits-parser";

async function example() {
  const commitGenerator = getGitCommits();
  for await (const commitInfo of commitGenerator) {
    const parsedCommit = parseConventionalCommit(commitInfo);
    console.log(parsedCommit);
    // Output: { type: 'feat', scope: 'scope', description: 'add new feature' }
  }
}

example();
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
