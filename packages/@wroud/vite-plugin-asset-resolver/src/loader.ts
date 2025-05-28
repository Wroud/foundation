import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES } from "./constants.js";
import type { IResolveAssetsOptions } from "./IResolveAssetsOptions.js";
import { getPossiblePaths } from "./getPossiblePaths.js";
import { access } from "node:fs/promises";

export { DEFAULT_DIST, DEFAULT_SRC, KNOWN_ASSET_TYPES };

interface ResolveHookContext {
  conditions: string[];
  importAttributes: Record<string, string>;
  parentURL?: string;
}

interface ResolveHookResult {
  url: string;
  format?: string;
  shortCircuit?: boolean;
  importAttributes?: Record<string, string>;
}

type NextResolve = (
  specifier: string,
  context: ResolveHookContext,
) => Promise<ResolveHookResult>;

/**
 * Get the globally stored options for the asset resolver
 */
function getGlobalOptions(): IResolveAssetsOptions | undefined {
  if (typeof globalThis !== "undefined") {
    return (globalThis as any).__ASSET_RESOLVER_OPTIONS__;
  }
  return undefined;
}

/**
 * Node.js loader resolve hook for asset resolution
 */
export async function resolve(
  specifier: string,
  context: ResolveHookContext,
  nextResolve: NextResolve,
): Promise<ResolveHookResult> {
  const options = getGlobalOptions();
  const {
    dist = DEFAULT_DIST,
    src = DEFAULT_SRC,
    extensions = KNOWN_ASSET_TYPES,
  } = options || {};

  // Remove leading dots and escape extensions for regex
  const escapedExtensions = extensions.map((ext: string) =>
    ext.replace(/^\./, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const extensionsPattern = escapedExtensions.join("|");

  // Build the dynamic regex
  const regex = new RegExp(`^\\.{1,2}\\/.*\\.(${extensionsPattern})(\\?.*)?$`);

  // Check if this is a relative asset import that we should handle
  if (!regex.test(specifier) || !context.parentURL) {
    return nextResolve(specifier, context);
  }

  const parentPath = fileURLToPath(context.parentURL);

  try {
    // Attempt default resolution first
    const result = await nextResolve(specifier, context);

    // Check if the resolved file exists
    try {
      await access(fileURLToPath(result.url));
      return result;
    } catch {
      // File doesn't exist, continue with custom resolution
    }
  } catch {
    // Default resolution failed, continue with custom resolution
  }

  // Try custom resolution using getPossiblePaths
  for (const adjustedImporter of getPossiblePaths(parentPath, dist, src)) {
    try {
      const adjustedParentURL = pathToFileURL(adjustedImporter).href;
      const adjustedContext = {
        ...context,
        parentURL: adjustedParentURL,
      };

      const result = await nextResolve(specifier, adjustedContext);

      // Check if the resolved file exists
      try {
        await access(fileURLToPath(result.url));
        return result;
      } catch {
        // File doesn't exist, try next possible path
        continue;
      }
    } catch {
      // Resolution failed, try next possible path
      continue;
    }
  }

  // If all custom resolutions failed, throw an error
  throw new Error(`Failed to resolve ${specifier} from ${context.parentURL}`);
}
