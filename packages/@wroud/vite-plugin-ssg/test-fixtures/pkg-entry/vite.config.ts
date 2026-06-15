import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  resolve: {
    alias: {
      "test-app-entry": path.join(dir, "node_modules/test-app-entry/index.tsx"),
    },
  },
  build: {
    outDir: "dist",
  },
  plugins: [ssgPlugin({ entry: "test-app-entry" })],
});
