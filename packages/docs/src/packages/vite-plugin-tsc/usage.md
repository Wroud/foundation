---
outline: deep
---

# Usage

Import the plugin and add it to your Vite configuration. Use `tscArgs` to pass arguments to the TypeScript compiler and enable `prebuild` if you rely on project references.

```ts
import { defineConfig } from "vite";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  plugins: [tscPlugin({ tscArgs: ["-b"], prebuild: true })],
});
```

For type checking only, disable `prebuild`:

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
