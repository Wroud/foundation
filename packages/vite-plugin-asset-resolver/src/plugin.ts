import path from "path";
import fs from "fs";
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
      async resolveId(source, importer) {
        if (regex.test(source)) {
          if (!source || !importer) {
            throw new Error("Source or importer is undefined in resolveId");
          }

          // Attempt default resolution
          const resolved = await this.resolve(source, importer, {
            skipSelf: true,
          });
          if (resolved) {
            return resolved;
          }

          const importerDir = path.dirname(importer);
          const pathParts = importerDir.split(path.sep);

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

              let adjustedImporterDir = path.join(...pathParts);

              if (importerDir.startsWith("/")) {
                adjustedImporterDir = "/" + adjustedImporterDir;
              }

              const srcPath = path.resolve(adjustedImporterDir, source);

              if (fs.existsSync(srcPath)) {
                return srcPath;
              }
            }
          }

          throw new Error(`Failed to resolve ${source} from ${importer}`);
        }
        return null;
      },
    },
  ];
}
