# @wroud/conventional-commits-changelog

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/conventional-commits-changelog.svg
[npm-url]: https://npmjs.com/package/@wroud/conventional-commits-changelog
[size]: https://packagephobia.com/badge?p=@wroud/conventional-commits-changelog
[size-url]: https://packagephobia.com/result?p=@wroud/conventional-commits-changelog

`@wroud/conventional-commits-changelog` is a TypeScript library designed to generate changelogs in markdown format based on conventional commit messages. It provides a structured and consistent format for documenting changes, helping developers keep track of notable updates and modifications in their projects.

## Features

- **Changelog Generation**: Automatically create changelogs from conventional commits.
- **Customizable Headers**: Generate changelog headers with options for headline levels and descriptions.
- **Structured Output**: Organize changelog entries by categories such as features, fixes, breaking changes, and contributors.
- **TypeScript Support**: Written in TypeScript for type safety and improved developer experience.
- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```sh
npm install @wroud/conventional-commits-changelog @wroud/conventional-commits-parser
```

## Usage

To generate a changelog, you first need to parse your conventional commit messages. Here's an example of how to use the library:

```ts
import {
  createConventionalChangelog,
  createConventionalChangelogHeader,
} from "@wroud/conventional-commits-changelog";
import { getGitCommits } from "@wroud/git";

async function generateChangelog(version: string, compareUrl?: string) {
  const commitGenerator = getGitCommits();
  const commits: any[] = []; // Adjust type as needed

  for await (const commitInfo of commitGenerator) {
    commits.push(commitInfo);
  }

  const header = createConventionalChangelogHeader(version, compareUrl);
  const changelog = createConventionalChangelog(commits);

  // Combine header and changelog output
  const output: string[] = [];
  for (const line of header) {
    output.push(line);
  }
  for await (const line of changelog) {
    output.push(line);
  }

  console.log(output.join("\n"));
}

// Example usage
generateChangelog(
  "1.0.0",
  "https://github.com/Wroud/foundation/compare/git-v0.1.1...git-v0.1.2",
);
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
