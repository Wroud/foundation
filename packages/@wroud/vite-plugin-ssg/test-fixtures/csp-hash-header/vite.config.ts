import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  build: {
    outDir: "dist",
  },
  plugins: [
    ssgPlugin({
      entry: "src/root.tsx",
      csp: {
        meta: false,
        algorithm: "sha384",
        manifest: "headers.json",
      },
    }),
  ],
});
