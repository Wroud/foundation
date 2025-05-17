---
outline: deep
---

# Usage

Below is a basic example showing how to configure the plugin in your Vite setup.

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
