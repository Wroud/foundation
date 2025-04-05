import type { PluginOption } from "vite";
import nodePath from "node:path";
import { tryStatSync } from "../utils/tryStatSync.js";
import { withTrailingSlash } from "../utils/withTrailingSlash.js";

const startsWithWordCharRE = /^\w/;
export function viteFsFallbackResolutionPlugin(): PluginOption {
  let rootInRoot: boolean;
  return {
    name: "@wroud/vite-plugin-ssg:module-resolution",
    apply: "serve",
    configResolved(config) {
      rootInRoot =
        tryStatSync(nodePath.join(config.root, config.root))?.isDirectory() ??
        false;
    },
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        const config = this.environment.config;

        if (
          source[0] === "/" &&
          (rootInRoot || !source.startsWith(withTrailingSlash(config.root)))
        ) {
          const fsPath = nodePath.posix.resolve(config.root, source.slice(1));
          return this.resolve(fsPath, importer, options);
        }

        if (
          source[0] === "." ||
          (importer?.endsWith(".html") && startsWithWordCharRE.test(source))
        ) {
          const basedir = importer
            ? nodePath.posix.dirname(importer)
            : config.root;
          const fsPath = nodePath.posix.resolve(basedir, source);
          return this.resolve(fsPath, importer, options);
        }

        return null;
      },
    },
  };
}
