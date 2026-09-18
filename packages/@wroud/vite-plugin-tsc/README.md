# @wroud/vite-plugin-tsc

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[npm]: https://img.shields.io/npm/v/@wroud/vite-plugin-tsc.svg
[npm-url]: https://npmjs.com/package/@wroud/vite-plugin-tsc

`@wroud/vite-plugin-tsc` brings the TypeScript compiler (`tsc`) to Vite. It transpiles your TypeScript with `tsc` and lets Vite bundle the output, keeping all Vite features intact, and surfaces the type errors that Vite's esbuild pipeline skips. The plugin supports TypeScript project references and the native TypeScript compiler (TypeScript 7 / `tsgo`).

## Features

- **Transpilation**: Transpiles TypeScript with `tsc` so Vite bundles the compiler's output.
- **Project References**: Builds TypeScript project references before Vite starts bundling.
- **Type Checking**: Reports type errors in the terminal and, optionally, in the Vite error overlay.
- **Watch Mode**: Keeps `tsc` running in watch mode alongside the dev server.
- **Native Compiler**: Uses the native compiler automatically with TypeScript 7, or `@typescript/native-preview` (`tsgo`) when `tsgo: true` is set.

## Installation

Install via npm:

```sh
npm install @wroud/vite-plugin-tsc
```

Install via yarn:

```sh
yarn add @wroud/vite-plugin-tsc
```

## Usage

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [tscPlugin()],
});
```

With no options the plugin runs `tsc -b`. Before Vite starts it builds the project and its references, so the emitted JavaScript is ready to bundle. In the dev server it then keeps `tsc -b --watch` running, and `vite build` compiles once before bundling and fails on type errors. Point Vite at the emitted files (your `outDir`) so it bundles the output of `tsc`.

## Use Cases

### Type Checking Only

```ts
tscPlugin({
  tscArgs: ["--project", "tsconfig.json", "--noEmit"],
  prebuild: false,
  enableOverlay: true,
});
```

Runs `tsc --noEmit` in watch mode without delaying the dev server start, and shows type errors in the Vite overlay. If type checking is all you need, also consider [`vite-plugin-checker`](https://github.com/fi3ework/vite-plugin-checker), which is dedicated to it and supports ESLint, Stylelint, `vue-tsc` and more.

### Type Check in Dev, Transpile in Build

```ts
export default defineConfig(({ command }) => ({
  plugins: [
    tscPlugin({
      tscArgs:
        command === "build"
          ? ["-b"]
          : ["--project", "tsconfig.json", "--noEmit"],
      prebuild: false,
      enableOverlay: true,
    }),
  ],
}));
```

Only type checks while developing, and transpiles with `tsc -b` when building (for example in CI).

### Build a Specific Project

```ts
tscPlugin({ tscArgs: ["-b", "tsconfig.app.json"] });
```

Any `tsc` arguments can be passed, exactly as on the command line.

### Native Compiler (TypeScript 7 / `tsgo`)

TypeScript 7 ships the native compiler and no longer exposes the JavaScript compiler API, so the plugin detects it and runs its `tsc` binary with no configuration. To try the native compiler while staying on TypeScript 6, install `@typescript/native-preview` and enable `tsgo`:

```ts
tscPlugin({ tsgo: true });
```

`tscArgs` work the same with both compilers, and TypeScript 7 specific flags such as `--checkers` or `--builders` can be passed through them.

## Full Configuration

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [
    tscPlugin({
      tscArgs: ["-b", "tsconfig.json"],
      prebuild: true,
      enableOverlay: true,
      verbose: false,
      tsgo: false,
    }),
  ],
});
```

| Option          | Default  | Description                                                                                                                                                                                                                                                             |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tscArgs`       | `["-b"]` | Arguments passed to `tsc`, exactly as on the command line. Build mode is used only when the first argument is `-b` / `--build`; otherwise it runs like `tsc --project`.                                                                                                 |
| `prebuild`      | `true`   | In watch mode (dev server or `vite build --watch`), run a full compile before Vite starts, so emitted files and project references exist before bundling. A regular `vite build` always compiles first. Set to `false` for type checking only to start without waiting. |
| `enableOverlay` | `false`  | Show type errors in the Vite error overlay.                                                                                                                                                                                                                             |
| `verbose`       | `false`  | Log every `tsc` status message and which compiler is used.                                                                                                                                                                                                              |
| `tsgo`          | `false`  | Use the native compiler from `@typescript/native-preview`. Not needed with `typescript@>=7`, which is always native.                                                                                                                                                    |

## Documentation

For detailed usage and API reference, visit the [documentation site](https://wroud.dev).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
