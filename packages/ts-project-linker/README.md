# @wroud/ts-project-linker

[![NPM version][npm]][npm-url]

[npm]: https://img.shields.io/npm/v/@wroud/ts-project-linker.svg
[npm-url]: https://npmjs.com/package/@wroud/ts-project-linker

@wroud/ts-project-linker is a CLI tool that helps synchronize TypeScript's project references with package dependencies. It supports sub-configurations such as `tsconfig.*.json` and provides commands for linking project references.

## Features

- **Sync Project References**: Automatically sync your TypeScript project references with package dependencies.
- **Supports Sub Configs**: Handles multiple TypeScript configuration files like `tsconfig.*.json`.
- **CLI Tool**: Simple command-line interface for ease of use.

## Installation

Install via npm:

\```
npm install @wroud/ts-project-linker
\```

Install via yarn:

\```
yarn add @wroud/ts-project-linker
\```

## Usage

\```
ts-link [paths..]
\```

### Commands:

- `ts-link glob [patterns..]`: Provide a single glob pattern for `tsconfig.json` locations.
- `ts-link link [paths..]`: Link TypeScript project references (default command).

### Options:

- `--immutable`: Do not modify the `tsconfig.json` files, will exit with 1 if changes are needed.
- `--verbose`: Print verbose output.

## Example

\```
ts-link ./packages/\*
\```

This will link all TypeScript project references found in the `./packages/` directory.

## Documentation

For more information and detailed documentation, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
