import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";

const dir = path.dirname(fileURLToPath(import.meta.url));

function adminPlugin(): Plugin {
  return {
    name: "fixture:admin",
    api: {
      ssg: {
        mounts: [{ path: "admin", entry: path.join(dir, "src/admin/app.tsx") }],
      },
    },
  };
}

export default defineConfig({
  root: dir,
  base: "/site/",
  build: {
    outDir: "dist",
  },
  plugins: [adminPlugin(), ssgPlugin()],
});
