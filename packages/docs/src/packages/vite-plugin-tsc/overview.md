---
outline: deep
---

# Vite Plugin TSC

`@wroud/vite-plugin-tsc` brings the TypeScript compiler (`tsc`) to Vite. Because Vite relies on esbuild for speed, TypeScript errors are not checked by default. This plugin can run `tsc` to surface type errors during development or builds and can also transpile TypeScript files, allowing Vite to be configured to consume those files without losing any of its features. It also supports TypeScript project references.

## Use Cases

- **Type checking**: Run `tsc` alongside Vite's dev server to report type errors that esbuild ignores.
- **Transpilation**: Transpile TypeScript files using `tsc`, then let Vite consume the generated files.

## Key Features

- **Transpilation**: Uses `tsc` to transpile TypeScript files.
- **Project references**: Supports TypeScript project references.
- **Background type checking**: Runs `tsc` in watch mode to surface type errors without blocking the Vite dev server.
- **Prebuild support**: Optionally builds dependencies before Vite starts.
- **Watch mode**: Automatically recompiles when files change.
- **IDE overlay**: Shows type errors in the browser overlay when `enableOverlay` is enabled.

## Examples

### Transpilation

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  root: "dist", // folder defined as tsc outDir
  plugins: [
    tscPlugin({
      tscArgs: ["-b"],
      prebuild: true, // recommended for TypeScript project references
    }),
  ],
});
```

### Type Checking Only

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [
    tscPlugin({
      tscArgs: ["--project", "tsconfig.json"],
      prebuild: false,
      enableOverlay: true,
    }),
  ],
});
```
