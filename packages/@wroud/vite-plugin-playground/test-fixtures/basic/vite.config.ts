import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";
import { playground } from "@wroud/vite-plugin-playground";
import { pnpPhysicalPaths } from "@wroud/vite-plugin-playground/plugin/pnpPhysicalPaths";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  build: { outDir: "dist" },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [pnpPhysicalPaths(), playground(), ssgPlugin(), tailwindcss()],
});
