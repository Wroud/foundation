---
outline: deep
---

# Vite Plugin TSC

`@wroud/vite-plugin-tsc` allows you to use the TypeScript compiler (`tsc`) within Vite. It transpiles project references and provides background type checking so you can keep using Vite's fast bundling while ensuring type safety.

## Key Features

- **Transpilation**: Uses `tsc` to transpile TypeScript and project references.
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
  plugins: [
    tscPlugin({
      tscArgs: ["-b"],
      prebuild: true,
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
