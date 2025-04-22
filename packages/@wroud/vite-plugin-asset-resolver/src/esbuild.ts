import path from "path";
import type { Plugin, OnResolveArgs, OnResolveResult } from "esbuild";
import { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES } from "./constants.js";
import type { IResolveAssetsOptions } from "./IResolveAssetsOptions.js";
import { getPossiblePaths } from "./getPossiblePaths.js";

export { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES };

export function assetResolverPlugin(options?: IResolveAssetsOptions): Plugin {
  const {
    dist = DEFAULT_DIST,
    src = DEFAULT_SRC,
    extensions = KNOWN_ASSET_TYPES,
  } = options || {};

  const escapedExtensions = extensions.map((ext) =>
    ext.replace(/^\./, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const extensionsPattern = escapedExtensions.join("|");

  const regex = new RegExp(`^\\.{1,2}\\/.*\\.(${extensionsPattern})(\\?.*)?$`);

  return {
    name: "asset-resolver-plugin",
    setup(build) {
      build.onResolve(
        { filter: regex },
        async (args: OnResolveArgs): Promise<OnResolveResult | undefined> => {
          const { path: source, importer, pluginData } = args;

          if (
            !importer ||
            !regex.test(source) ||
            (pluginData && pluginData["asset-resolver-plugin"])
          ) {
            return;
          }

          try {
            const result = await build.resolve(source, {
              kind: args.kind,
              resolveDir: path.dirname(importer),
              pluginData: { "asset-resolver-plugin": true },
            });

            if (!result.errors.length) {
              return { path: result.path };
            }
          } catch (error) {
            // Continue with custom resolution if default fails
          }

          for (const adjustedImporter of getPossiblePaths(
            importer,
            dist,
            src,
          )) {
            try {
              const result = await build.resolve(source, {
                kind: args.kind,
                resolveDir: path.dirname(adjustedImporter),
                pluginData: { "asset-resolver-plugin": true },
              });

              if (!result.errors.length) {
                return { path: result.path };
              }
            } catch (error) {
              // Try next srcAlias
            }
          }

          return {
            errors: [{ text: `Failed to resolve ${source} from ${importer}` }],
          };
        },
      );
    },
  };
}
