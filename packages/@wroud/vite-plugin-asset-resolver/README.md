# @wroud/vite-plugin-asset-resolver

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-asset-resolver.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-asset-resolver

`@wroud/vite-plugin-asset-resolver` is a flexible plugin that resolves asset imports by mapping 'dist' directories to 'src' directories, supporting custom file extensions. It works with Vite, esbuild, and Node.js, enabling custom asset resolution when default behavior fails, particularly for complex project structures.

## Features

- **Custom Asset Resolution**: Resolves asset imports (e.g., images, SVG) from `src` instead of `dist`.
- **Multiple Aliases**: Supports custom aliases for both `src` and `dist` directories.
- **Custom Extensions**: Allows configuring which file extensions should be resolved.
- **Multiple Platforms**: Works with Vite, esbuild, and Node.js loaders.gin-asset-resolver

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

## Usage

### Vite Plugin

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

### esbuild Plugin

```ts
import { build } from "esbuild";
import { assetResolverPlugin } from "@wroud/vite-plugin-asset-resolver/esbuild";

build({
  entryPoints: ["src/index.ts"],
  plugins: [
    assetResolverPlugin({
      dist: ["dist", "build"],
      src: ["src", "source"],
      extensions: [".svg", ".png", ".jpg"],
    }),
  ],
});
```

### Node.js Loader

#### Method 1: Programmatic Registration

```ts
import { registerAssetResolver } from "@wroud/vite-plugin-asset-resolver/node-loader-register";

// Register the loader before importing any modules that need asset resolution
registerAssetResolver({
  dist: ["dist", "build"],
  src: ["src", "source"],
  extensions: [".svg", ".png", ".jpg"],
});

// Now import your modules
import "./your-module-with-assets.js";
```

#### Method 2: Command Line Usage

```sh
# Basic usage
node --loader @wroud/vite-plugin-asset-resolver/loader your-script.js

# With custom options via environment variable
ASSET_RESOLVER_OPTIONS='{"dist":["build"],"src":["source"]}' node --loader @wroud/vite-plugin-asset-resolver/loader your-script.js
```

#### Method 3: Using register API in entry point

```ts
// main.ts
import { register } from "node:module";

// Register the loader
register("@wroud/vite-plugin-asset-resolver/loader", import.meta.url);

// Set options globally
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__ASSET_RESOLVER_OPTIONS__ = {
    dist: ["dist", "build"],
    src: ["src", "source"],
    extensions: [".svg", ".png", ".jpg"],
  };
}

// Import your application
import "./app.js";
```

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
