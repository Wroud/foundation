import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";

function pingApi(): Plugin {
  return {
    name: "fixture:ping-api",
    configureServer(server) {
      server.middlewares.use("/__ping", (_req, res) => {
        res.setHeader("content-type", "text/plain");
        res.end("pong");
      });
    },
  };
}

const dir = path.dirname(fileURLToPath(import.meta.url));
// PnP maps workspace deps to __virtual__ paths whose tsconfig "extends" cannot
// be resolved by oxc during transforms; alias to the physical package (and
// dedupe react, which the physical path would otherwise duplicate) so the
// fixture behaves like a published install.
const diReact = path.resolve(dir, "../../../di-react/lib");

export default defineConfig({
  root: dir,
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: [
      {
        find: /^@wroud\/di-react$/,
        replacement: path.join(diReact, "index.js"),
      },
      { find: /^@wroud\/di-react\/(.*)$/, replacement: diReact + "/$1" },
    ],
    dedupe: ["react", "react-dom"],
  },
  plugins: [pingApi(), ssgPlugin()],
});
