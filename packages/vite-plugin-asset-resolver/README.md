# @wroud/vite-plugin-asset-resolver

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-asset-resolver.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-asset-resolver

`@wroud/vite-plugin-asset-resolver` is a flexible Vite plugin that resolves asset imports by mapping 'dist' directories to 'src' directories, supporting custom file extensions. It enables custom asset resolution when Vite’s default behavior fails, particularly for complex project structures.

## Features

- **Custom Asset Resolution**: Resolves asset imports (e.g., images, SVG) from `src` instead of `dist`.
- **Multiple Aliases**: Supports custom aliases for both `src` and `dist` directories.
- **Custom Extensions**: Allows configuring which file extensions should be resolved.

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-asset-resolver
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-asset-resolver
```

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Example

```ts
import { defineConfig } from "vite";
import { assetResolverPlugin } from "@wroud/vite-plugin-asset-resolver";

export default defineConfig({
  plugins: [
    assetResolverPlugin({
      dist: ["dist", "build"],
      src: ["src", "source"],
      extensions: [".svg", ".png", ".jpg"],
    }),
  ],
});
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
