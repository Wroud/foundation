import { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES } from "./constants.js";
import type { PluginOption } from "vite";
import type { IResolveAssetsOptions } from "./IResolveAssetsOptions.js";
import { getPossiblePaths } from "./getPossiblePaths.js";

export { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES };

export function assetResolverPlugin(
  options?: IResolveAssetsOptions,
): PluginOption {
  // Ensure options are provided with default values
  const {
    dist = DEFAULT_DIST,
    src = DEFAULT_SRC,
    extensions = KNOWN_ASSET_TYPES,
  } = options || {};

  // Remove leading dots and escape extensions for regex
  const escapedExtensions = extensions.map((ext) =>
    ext.replace(/^\./, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const extensionsPattern = escapedExtensions.join("|");

  // Build the dynamic regex
  const regex = new RegExp(`^\\.{1,2}\\/.*\\.(${extensionsPattern})(\\?.*)?$`);

  return [
    {
      name: "asset-resolver-plugin",
      enforce: "post",
      resolveId: {
        order: "post",
        async handler(source, importer, options) {
          if (!importer || !regex.test(source)) {
            return;
          }

          // Attempt default resolution
          const resolved = await this.resolve(source, importer, options);
          if (resolved) {
            return resolved;
          }

          for (const adjustedImporter of getPossiblePaths(
            importer,
            dist,
            src,
          )) {
            const resolvedId = await this.resolve(
              source,
              adjustedImporter,
              options,
            );

            if (resolvedId) {
              return resolvedId;
            }
          }

          throw new Error(`Failed to resolve ${source} from ${importer}`);
        },
      },
    },
  ];
}
