import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { assetResolverPlugin } from "@wroud/vite-plugin-asset-resolver";
import { playground } from "@wroud/vite-plugin-playground";
import { pnpPhysicalPaths } from "@wroud/vite-plugin-playground/plugin/pnpPhysicalPaths";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";
import { tscPlugin } from "@wroud/vite-plugin-tsc";

export default defineConfig({
  root: "src",
  build: { outDir: "../dist", emptyOutDir: true },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [
    pnpPhysicalPaths(),
    tscPlugin({ enableOverlay: true }),
    assetResolverPlugin(),
    playground({ imports: ["@wroud/react-split-view", "@wroud/react-tree"] }),
    ssgPlugin(),
    tailwindcss(),
  ],
});
