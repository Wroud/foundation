import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { ssgPlugin } from "@wroud/vite-plugin-ssg";
import { playground } from "@wroud/vite-plugin-playground";

const dir = path.dirname(fileURLToPath(import.meta.url));

function pnpPhysicalPaths(): Plugin {
  let resolveVirtual: ((p: string) => string | null) | undefined;
  try {
    resolveVirtual = createRequire(import.meta.url)("pnpapi").resolveVirtual;
  } catch {}
  return {
    name: "fixture:pnp-physical-paths",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!resolveVirtual) return null;
      const resolved = await this.resolve(source, importer, options);
      if (!resolved || !resolved.id.includes("/__virtual__/")) return resolved;
      const [file, query] = resolved.id.split("?", 2);
      const physical = resolveVirtual(file!);
      if (!physical || physical.includes("/.yarn/")) return resolved;
      return { ...resolved, id: query ? `${physical}?${query}` : physical };
    },
  };
}

export default defineConfig({
  root: dir,
  build: { outDir: "dist" },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [pnpPhysicalPaths(), playground(), ssgPlugin(), tailwindcss()],
});
