import path from "path";
import { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES } from "./constants.js";
import type { PluginOption } from "vite";

export { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES };

interface IResolveAssetsOptions {
  dist?: string[];
  src?: string[];
  extensions?: string[];
}

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
      enforce: "pre",
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          if (!importer || !regex.test(source)) {
            return;
          }

          // Attempt default resolution
          const resolved = await this.resolve(source, importer, options);
          if (resolved) {
            return resolved;
          }

          const pathParts = importer.split(path.sep);

          let distIndex = -1;
          for (let i = pathParts.length - 1; i >= 0; i--) {
            if (dist.includes(pathParts[i]!)) {
              distIndex = i;
              break;
            }
          }

          if (distIndex !== -1) {
            for (const srcAlias of src) {
              pathParts[distIndex] = srcAlias;

              let adjustedImporter = path.join(...pathParts);

              if (importer.startsWith("/")) {
                adjustedImporter = "/" + adjustedImporter;
              }

              const resolvedId = await this.resolve(
                source,
                adjustedImporter,
                options,
              );

              if (resolvedId) {
                return resolvedId;
              }
            }
          }

          throw new Error(`Failed to resolve ${source} from ${importer}`);
        },
      },
    },
  ];
}
