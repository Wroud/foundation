import type { PluginOption } from "vite";
import { getPathsToLookup } from "../utils/getPathsToLookup.js";
import {
  isSsgComponentId,
  removeSsgComponentQuery,
} from "../modules/isSsgComponentId.js";

export function ssgComponentResolution(): PluginOption {
  return {
    name: "@wroud/vite-plugin-ssg:component-resolution",
    resolveId: {
      async handler(source, importer, resolveOptions) {
        if (!isSsgComponentId(source) || source.includes("\0")) return null;

        const config = this.environment.config;
        const { custom = {} } = resolveOptions;
        const {
          "@wroud/vite-plugin-ssg:component-resolution": ssgResolve = {},
        } = custom;
        const { resolved: alreadyResolved } = ssgResolve;

        if (alreadyResolved) {
          return alreadyResolved;
        }

        if (importer && importer.includes("\0")) {
          importer = undefined;
        }

        let [sourcePath, params] = removeSsgComponentQuery(source).split(
          "?",
        ) as [string, string | undefined];
        const suffix = params ? `?${params}` : "";

        const lookUpPaths = getPathsToLookup(sourcePath);

        for (const path of lookUpPaths) {
          if (path === config.root) {
            break;
          }

          const resolvedId = path + suffix;
          const resolvedResolved = await this.resolve(resolvedId, importer, {
            ...resolveOptions,
            skipSelf: true,
            custom: {
              ...custom,
              "@wroud/vite-plugin-ssg:component-resolution": {
                ...ssgResolve,
                resolved: resolvedId,
              },
            },
          });

          if (resolvedResolved) {
            if (resolvedResolved.external) {
              return false;
            }
            if (resolvedResolved.id !== resolvedId) {
              return resolvedResolved;
            }
            return { id: resolvedId, meta: resolvedResolved.meta };
          }
        }

        return null;
      },
    },
  };
}
