---
outline: deep
---

# Usage

The plugin supports two main scenarios: transpiling TypeScript or just checking types. In both cases, import the plugin and add it to your Vite configuration. Use `tscArgs` to pass arguments to the TypeScript compiler and enable `prebuild` if you rely on project references.

## Transpilation

Use `tsc` to emit JavaScript that Vite will bundle. Point Vite at the emitted files so all of its features continue to work:

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  root: "dist", // folder defined as tsc outDir
  plugins: [
    tscPlugin({ tscArgs: ["-b"], prebuild: true }), // prebuild is useful for project references
  ],
});
```

## Type Checking

Run `tsc` in watch mode without emitting files to surface type errors while keeping esbuild's output:

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
