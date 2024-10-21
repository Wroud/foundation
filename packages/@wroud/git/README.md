# @wroud/git

[![ESM-only package][package]][esm-info-url]
[![NPM version][npm]][npm-url]

<!-- [![Install size][size]][size-url] -->

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[esm-info-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/git.svg
[npm-url]: https://npmjs.com/package/@wroud/git
[size]: https://packagephobia.com/badge?p=@wroud/git
[size-url]: https://packagephobia.com/result?p=@wroud/git

`@wroud/git` is a lightweight toolset for working with local git repositories. It provides utilities to retrieve and parse git commits and tags, making it useful for building CI/CD workflows, especially for automated release processes based on conventional commits.

## Features

- **getGitCommits**: Retrieves a list of parsed git commits as an async generator. It supports filtering commits by a specified path (default: `'.'`) and a range of commits defined by the `from` and `to` parameters. You can limit the number of commits using `maxCommits`. Additionally, the function can include associated tags, trailers (metadata in commits), and even custom trailers and links based on user-defined regular expressions.

- **getGitLastSemverTag**: Returns the most recent semantic version tag from the git history. By default, it checks up to `HEAD` and looks for tags with a `v` prefix, although both can be customized through the `to` and `prefix` parameters.

- [Pure ESM package][esm-info-url]

## Installation

Install via npm:

```
npm install @wroud/git
```

Install via yarn:

```
yarn add @wroud/git
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
