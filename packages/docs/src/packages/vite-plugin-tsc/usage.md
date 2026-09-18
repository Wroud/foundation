---
outline: deep
---

# Usage

Import the plugin and add it to your Vite configuration:

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
