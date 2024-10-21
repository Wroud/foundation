# ts-template

[![NPM version][npm]][npm-url]

[npm]: https://img.shields.io/npm/v/@wroud/ts-template.svg
[npm-url]: https://npmjs.com/package/@wroud/ts-template

`@wroud/ts-template` is a CLI tool that simplifies the setup of TypeScript projects and `tsconfig` files. It provides commands to quickly initialize a new TypeScript project or create a base `tsconfig` configuration with customizable options.

## Features

- **Quick Setup**: Easily create new TypeScript projects or `tsconfig` files with a single command.
- **ECMAScript Targeting**: Choose from multiple ECMAScript targets (e.g., `esnext`, `es2022`).
- **Immutable Mode**: Preview changes without modifying files.
- **Verbose Mode**: Get detailed output for better debugging.

## Installation

Install via npm:

```bash
npm install -D ts-template
```

Install via yarn:

```bash
yarn add -D ts-template
```

## Example

Let's say you run the following command inside the directory `~/docs/project/packages/@my-scope/tsconfig`:

```bash
# Create a new project with a base tsconfig targeting ESNext
ts-template tsconfig
```

This command will:

1. Initialize a project using Yarn (currently, only Yarn is supported as the package manager) with the name `@my-scope/tsconfig`.
2. Create a base `tsconfig.json` file in the project.

Now, let's imagine you run the following command inside the directory `~/docs/project/packages/@my-scope/my-package`:

```bash
# Create a new project that references the tsconfig package from the same scope
ts-template project
```

This command will:

1. Initialize a new project using Yarn with the name `@my-scope/my-package`.
2. Create a `tsconfig.json` file that extends the configuration from `@my-scope/tsconfig/tsconfig.json` (created in the previous step).

## Usage

```bash
ts-template <command> [options]
```

### Commands

- **`tsconfig [name]`**: Create a new project with a base `tsconfig` file.

  ```bash
  ts-template tsconfig [name] [options]
  ```

  - **Positional Arguments:**

    - `[name]`: Name of the project (defaults to an npm-friendly name based on the current folder).

  - **Options:**
    - `--immutable, -i`: Do not modify files, just print the changes that would be made.
    - `--verbose, -v`: Print detailed output.
    - `--target, -t`: Specify the ECMAScript target (choices: `esnext`, `es2022`, etc.).

  **Example:**

  ```bash
  ts-template tsconfig my-project --target es2022 --verbose
  ```

- **`project [name]`**: Create a new project that references a base `tsconfig` package.

  ```bash
  ts-template project [name] [options]
  ```

  - **Positional Arguments:**

    - `[name]`: Name of the project (defaults to an npm-friendly name based on the current folder).

  - **Options:**
    - `--tsconfig, --ts`: The name of the `tsconfig` package to link (default: `tsconfig`).
    - `--immutable, -i`: Do not modify files, just print the changes that would be made.
    - `--verbose, -v`: Print detailed output.
    - `--target, -t`: Specify the ECMAScript target (choices: `esnext`, `es2022`, etc.).

  **Example:**

  ```bash
  ts-template project my-library --tsconfig tsconfig --target es2022 --immutable
  ```

### Global Options

- `--help`: Display help for the command.
- `--version`: Display the version of `ts-template`.

## Documentation

For more detailed documentation, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be listed in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
