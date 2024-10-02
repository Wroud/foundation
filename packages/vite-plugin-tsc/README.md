# @wroud/vite-plugin-tsc

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-tsc.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-tsc

`@wroud/vite-plugin-tsc` is a Vite plugin that uses the TypeScript compiler (`tsc`) to transpile TypeScript sources, allowing Vite to bundle the transpiled code seamlessly.

## Features

- **Transpilation**: Automatically transpiles TypeScript code using `tsc`.
- **Watch Mode**: Supports watch mode for continuous development.
- **Easy Integration**: Simple to add to your Vite project.

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-tsc
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-tsc
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [
    tscPlugin({
      tscArgs: ["-b", "--project", "tsconfig.json"],
    }),
  ],
});
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
