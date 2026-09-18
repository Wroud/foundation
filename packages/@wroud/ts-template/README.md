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
- **Safe by Default**: Never scaffolds a workspace root or a scope folder, and asks before touching an existing `package.json` or `tsconfig.json`.

## Installation

Install via npm:

```bash
npm install -D @wroud/ts-template
```

Install via yarn:

```bash
yarn add -D @wroud/ts-template
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

`ts-template` always scaffolds the **current directory**. The optional `[name]` argument only sets the package name written to `package.json`; it does not choose where the package is created. Create the package folder first and run the command from inside it.

### Yarn workspaces

When `@wroud/ts-template` is a devDependency of the workspace root, run it with `yarn run -T` (top-level) so the root's binary is found:

```bash
mkdir -p packages/@my-scope/my-package
cd packages/@my-scope/my-package
yarn run -T ts-template project --ts @my-scope/tsconfig
```

Plain `yarn ts-template` only works while the folder has no `package.json` of its own. Once it has one, Yarn reports `Couldn't find a script named "ts-template"`. That does not mean you should run the command from the root; use `yarn run -T` instead.

### Safety checks

Before changing anything, `ts-template` checks the current directory:

- **Workspace root** (its `package.json` declares `workspaces`): refused, even with `--force`. The error message prints the command to run from the right folder.
- **Scope folder** (a directory named like `@my-scope`): refused.
- **Not a workspace**: inside a workspace project, a directory that matches none of the root's `workspaces` globs is refused, because Yarn would not treat it as a package.
- **Existing `package.json` or `tsconfig.json`**: in a terminal, `ts-template` lists what it will change and asks for confirmation. When not attached to a terminal (CI, scripts, AI agents), it stops without changing anything and tells you to re-run with `--force`. An existing `package.json` is updated in place and never replaced, so fields such as `scripts`, `dependencies` and `workspaces` are preserved.

`--immutable` runs the same checks and reports what would happen.

### Commands

- **`tsconfig [name]`**: Create a new project with a base `tsconfig` file.

  ```bash
  ts-template tsconfig [name] [options]
  ```

  - **Positional Arguments:**

    - `[name]`: Package name to write to `package.json` (defaults to an npm-friendly name based on the current folder). It does not select the target directory.

  - **Options:**
    - `--immutable, -i`: Do not modify files, just print the changes that would be made.
    - `--force, -f`: Modify an existing `package.json`/`tsconfig.json` in the current directory without asking.
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

    - `[name]`: Package name to write to `package.json` (defaults to an npm-friendly name based on the current folder). It does not select the target directory.

  - **Options:**
    - `--tsconfig, --ts`: The name of the `tsconfig` package to link (default: `tsconfig`).
    - `--immutable, -i`: Do not modify files, just print the changes that would be made.
    - `--force, -f`: Modify an existing `package.json`/`tsconfig.json` in the current directory without asking.
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
