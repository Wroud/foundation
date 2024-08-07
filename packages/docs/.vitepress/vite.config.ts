/// <reference types="node" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";

export default defineConfig({
  esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  },
  plugins: [
    Components({
      dirs: [fileURLToPath(new URL("./components", import.meta.url))],
      dts: fileURLToPath(new URL("../components.d.ts", import.meta.url)),
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      extensions: ["vue", "md"],
    }),
    UnoCSS(fileURLToPath(new URL("./uno.config.ts", import.meta.url))),
  ],
});
