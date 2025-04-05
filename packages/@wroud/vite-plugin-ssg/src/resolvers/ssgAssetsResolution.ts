import type { PluginOption } from "vite";
import { isMainId } from "../modules/mainQuery.js";
import { cleanUrl } from "../utils/cleanUrl.js";
import { createSsgAssetId, isSsgAssetId } from "../modules/isSsgAssetId.js";
import { isUrlId } from "../modules/removeUrlQuery.js";
import { isSsgPageUrlId } from "../modules/isSsgPageUrlId.js";

export function ssgAssetsResolutionPlugin(): PluginOption {
  return {
    name: "@wroud/vite-plugin-ssg:assets-resolution",
    applyToEnvironment: (env) => env.name === "ssr",
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        const config = this.environment.config;

        if (
          isMainId(source) ||
          isUrlId(source) ||
          isSsgPageUrlId(source) ||
          config?.assetsInclude(cleanUrl(source))
        ) {
          const resolved = await this.resolve(source, importer, options);

          if (!resolved) {
            return undefined;
          }

          if (isSsgAssetId(resolved.id)) {
            return resolved;
          }

          return createSsgAssetId(resolved.id);
        }

        return null;
      },
    },
  };
}
