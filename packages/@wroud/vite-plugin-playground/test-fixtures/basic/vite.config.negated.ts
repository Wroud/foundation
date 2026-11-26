import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { playground } from "@wroud/vite-plugin-playground";

export default defineConfig({
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [
    playground({
      stories: ["src/**/*.stories.tsx", "!src/Button.stories.tsx"],
    }),
  ],
});
