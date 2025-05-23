import type { PluginOption } from "vite";
import { readFile } from "node:fs/promises";
import { isMainId, removeMainQuery } from "../modules/mainQuery.js";
import { cleanUrl } from "../utils/cleanUrl.js";
import {
  cleanSsgAssetId,
  createSsgAssetId,
  isSsgAssetId,
} from "../modules/isSsgAssetId.js";
import { isUrlId, removeUrlQuery } from "../modules/removeUrlQuery.js";
import {
  isSsgPageUrlId,
  removeSsgPageUrlId,
} from "../modules/isSsgPageUrlId.js";
import { changePathExt } from "../utils/changePathExt.js";
import { createSsgClientEntryId } from "../modules/isSsgClientEntryId.js";
import { mapBaseToUrl } from "../utils/mapBaseToUrl.js";
import { splitFileAndPostfix } from "../utils/splitFileAndPostfix.js";
import { isGitLfsPlaceholder } from "../utils/isGitLfsPlaceholder.js";
import nodePath from "node:path";

// Vite's regex patterns for inline detection
const noInlineRE = /[?&]no-inline\b/;
const inlineRE = /[?&]inline\b/;
const DEFAULT_ASSETS_INLINE_LIMIT = 4096;

export function ssgAssetsResolutionPlugin(): PluginOption {
  async function shouldInline(
    id: string,
    content: Buffer,
    environment: any,
  ): Promise<boolean> {
    // Match Vite's shouldInline logic exactly
    if (noInlineRE.test(id)) return false;
    if (inlineRE.test(id)) return true;

    // Check for Git LFS placeholder - don't inline LFS files
    if (isGitLfsPlaceholder(content)) {
      return false;
    }

    // Build-specific checks
    if (environment.config.command === "build") {
      if (environment.config.build.lib) return true;
      // Note: We can't easily check isEntry here without the module info
    }

    // Don't inline HTML files
    if (id.endsWith(".html")) return false;

    // Don't inline SVG with fragments (hash in URL)
    const [file] = splitFileAndPostfix(id);
    if (file.endsWith(".svg") && id.includes("#")) return false;

    // Check against assetsInlineLimit
    let limit: number;
    const { assetsInlineLimit } = environment.config.build;
    if (typeof assetsInlineLimit === "function") {
      const cleanedId = cleanUrl(id);
      const userShouldInline = assetsInlineLimit(cleanedId, content);
      if (userShouldInline != null) return userShouldInline;
      limit = DEFAULT_ASSETS_INLINE_LIMIT;
    } else {
      limit = Number(assetsInlineLimit) || DEFAULT_ASSETS_INLINE_LIMIT;
    }

    // Check content length vs limit
    return content.length < limit;
  }

  return {
    name: "@wroud/vite-plugin-ssg:assets-resolution",
    applyToEnvironment: (env) => env.name === "ssr",
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        const config = this.environment.config;

        if (options.custom?.["ssg-assets-resolution"]) {
          return null;
        }

        const isAsset = config?.assetsInclude(cleanUrl(source));

        if (
          isMainId(source) ||
          isUrlId(source) ||
          isSsgPageUrlId(source) ||
          isAsset
        ) {
          const resolved = await this.resolve(source, importer, {
            ...options,
            custom: {
              ...options.custom,
              "ssg-assets-resolution": true,
            },
          });

          if (!resolved) {
            return undefined;
          }

          if (isSsgAssetId(resolved.id)) {
            return resolved;
          }

          if (isAsset) {
            // Check if this asset will be inlined by Vite
            try {
              const cleanedId = cleanUrl(resolved.id);
              const content = await readFile(cleanedId);
              const willBeInlined = await shouldInline(
                resolved.id,
                content,
                this.environment,
              );

              // If the asset will be inlined, don't wrap it with SSG asset ID
              // Let Vite handle it naturally
              if (willBeInlined) {
                return resolved;
              }
            } catch (error) {
              // If we can't read the file, assume it won't be inlined
              // This is safer than crashing
            }
          }

          return createSsgAssetId(resolved.id);
        }

        return null;
      },
    },
    load: {
      order: "pre",
      async handler(id) {
        const config = this.environment.config;

        if (isSsgAssetId(id)) {
          if (isSsgPageUrlId(id)) {
            id = changePathExt(id, "");

            if (config.command === "serve") {
              id = removeSsgPageUrlId(cleanSsgAssetId(id));
              id = changePathExt(
                nodePath.posix.relative(config.root, id),
                ".html",
              );

              return {
                code: `export default ${JSON.stringify(id)};`,
                moduleType: "js",
              };
            }
          }

          if (isMainId(id)) {
            id = createSsgClientEntryId(removeMainQuery(id));
          }
          id = removeUrlQuery(cleanSsgAssetId(id));

          if (config.command === "serve") {
            if (id.startsWith(config.root)) {
              id = nodePath.posix.relative(config.root, id);
              this.debug(`Transformed to server URL: ${id}`);
            } else {
              id = mapBaseToUrl("/@fs" + id, config);
              this.debug(`Transformed to fs path: ${id}`);
            }
          }

          return {
            code: `export default ${JSON.stringify(id)};`,
            moduleType: "js",
          };
        }

        return null;
      },
    },
  };
}
