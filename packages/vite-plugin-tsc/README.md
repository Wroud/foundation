# @wroud/vite-plugin-tsc

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-tsc.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-tsc

`@wroud/vite-plugin-tsc` is a Vite plugin designed to transpile TypeScript and its project references using the TypeScript compiler (`tsc`). This plugin allows Vite to seamlessly bundle the transpiled code while also providing background type checking for your project, ensuring type safety and enhancing the development workflow.

## Features

- **Transpilation**: Automatically transpiles TypeScript code using `tsc`.
- **Background Type Checking**: Performs type checking in the background without blocking Vite, allowing for a smoother development experience.
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

## Example - Transpilation

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [
    tscPlugin({
      tscArgs: ["-b"],
      // Enable prebuild to ensure dependencies are built before Vite starts bundling
      prebuild: true, // Recommended for projects with TypeScript project references
    }),
  ],
});
```

## Example - Type Checking Only

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [
    tscPlugin({
      tscArgs: ["--project", "tsconfig.json"],
      // Prebuild is not needed for type checking only
      prebuild: false, // Skip prebuilding for faster startup
      enableOverlay: true, // Show errors in Vite overlay
    }),
  ],
});
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
