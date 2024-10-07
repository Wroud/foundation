# @wroud/github

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/github.svg
[npm-url]: https://npmjs.com/package/@wroud/github
[size]: https://packagephobia.com/badge?p=@wroud/github
[size-url]: https://packagephobia.com/result?p=@wroud/github

`@wroud/github` is a lightweight library designed to work with git history and GitHub-specific information like co-authors, issues, commit links, and GitHub references. It provides a structured way to parse commit messages, handle GitHub metadata, and generate proper GitHub URLs for issues and commits.

This library uses the `IGitCommitInfo` interface from [`@wroud/git`](https://npmjs.com/package/@wroud/git). You can obtain git commits by using the `getGitCommits` function from `@wroud/git`.

## Features

- **GitHub metadata**: Extract co-authors, GitHub issue links, and commit references from git commits.
- **TypeScript**: Written in TypeScript for type safety and modern JavaScript support.
- **GitHub URL generation**: Easily generate URLs for issues and commits.
- [Pure ESM package][package-url]

## Installation

Install via npm:

```sh
npm install @wroud/github @wroud/git
```

Install via yarn:

```sh
yarn add @wroud/github @wroud/git
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```ts
import { getGitCommits } from "@wroud/git";
import {
  getGithubTrailers,
  getGithubLink,
  gitGithubLinks,
} from "@wroud/github";

const REPOSITORY = "wroud/repository";

// Fetch commits using getGitCommits from @wroud/git
async function printCommitLinks() {
  for await (const commit of getGitCommits({
    from: "v1.0.0",
    to: "HEAD",
    customLinks: [...gitGithubLinks], // Pass gitGithubLinks to getGitCommits
  })) {
    let message = commit.message;

    // Extract GitHub trailers (including co-authors)
    const trailers = getGithubTrailers(commit);

    // Iterate through commit links and replace tokens with GitHub links
    for (const [token, link] of Object.entries(commit.links)) {
      const githubLink = getGithubLink(link, REPOSITORY);

      if (githubLink) {
        message = message.replaceAll(token, `[${token}](${githubLink})`);
      }
    }

    console.log(`Commit: ${commit.hash}`);
    console.log(`Message: ${message}`);
    if (trailers.coAuthors.length) {
      console.log(
        `Co-authors: ${trailers.coAuthors.map((coAuthor) => coAuthor.name).join(", ")}`,
      );
    }
  }
}

printCommitLinks();
```

## API

### Interfaces

#### `IGithubCoAuthor`

Represents information about a GitHub co-author.

```ts
interface IGithubCoAuthor {
  name: string;
  username?: string;
  usernameLink?: string;
  link?: string;
  email?: string;
}
```

#### `IGithubTrailers`

Contains metadata such as GitHub co-authors.

```ts
interface IGithubTrailers {
  coAuthors: IGithubCoAuthor[];
}
```

### Functions

#### `getGithubTrailers`

Extracts GitHub trailers (such as co-authors) from a commit message.

```ts
function getGithubTrailers(
  commit: IGitCommitInfo,
  options?: { loadGithubUserNames?: boolean },
): IGithubTrailers;
```

#### `getGithubLink`

Generates a GitHub link for a specific issue or commit.

```ts
function getGithubLink(link: IGitLink, repository: string): string | null;
```

### Constants

#### `gitGithubLinks`

A list of regular expressions to match GitHub issue and PR references.

```ts
const gitGithubLinks = [
  /[^\w](?<token>#(?<link>\d+)(?<gh>))/gi,
  /[^\w](?<token>GH-(?<link>\d+)(?<gh>))/g,
  /[^\w](?<token>(?<repository>[^\/\s]+\/[^\/\s]+)#(?<link>\d+)(?<gh>))/gi,
];
```

#### `GithubURL`

Utility to generate GitHub issue and commit URLs.

```ts
const GithubURL = {
  issue: (repository: string, issue: number) =>
    `https://github.com/${repository}/issues/${issue}`,
  commit: (repository: string, hash: string) =>
    `https://github.com/${repository}/commit/${hash}`,
};
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
