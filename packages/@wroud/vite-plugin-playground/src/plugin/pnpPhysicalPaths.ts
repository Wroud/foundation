import { createRequire } from "node:module";
import type { Plugin } from "vite";

export function pnpPhysicalPaths(): Plugin {
  let resolveVirtual: ((path: string) => string | null) | undefined;
  try {
    resolveVirtual = createRequire(import.meta.url)("pnpapi").resolveVirtual;
  } catch {}

  return {
    name: "@wroud/vite-plugin-playground:pnp-physical-paths",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!resolveVirtual) return null;
      const resolved = await this.resolve(source, importer, options);
      if (!resolved || !resolved.id.includes("/__virtual__/")) return null;
      const [file, query] = resolved.id.split("?", 2);
      const physical = resolveVirtual(file!);
      if (!physical || physical.includes("/.yarn/")) return null;
      return { ...resolved, id: query ? `${physical}?${query}` : physical };
    },
  };
}
