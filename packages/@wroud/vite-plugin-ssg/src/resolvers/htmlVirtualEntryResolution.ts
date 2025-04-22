import type { Plugin } from "vite";
import { isVirtualHtmlEntry } from "../modules/isVirtualHtmlEntry.js";
import type {
  OutputAsset,
  OutputBundle,
  NormalizedOutputOptions,
} from "rollup";

// Define the interface for the plugin that extends Vite's Plugin interface
export interface HtmlVirtualEntryResolutionPlugin extends Plugin {
  virtualHtmlChunks?: Map<string, OutputAsset>;
}

export function htmlVirtualEntryResolution(): HtmlVirtualEntryResolutionPlugin {
  // Cast the return value to include our custom properties
  const plugin: HtmlVirtualEntryResolutionPlugin = {
    name: "@wroud/vite-plugin-ssg:html-virtual-entry-resolution",
    virtualHtmlChunks: undefined,
    enforce: "post",
    resolveId: {
      order: "pre",
      handler(source: string) {
        if (isVirtualHtmlEntry(source)) {
          return { id: source, moduleSideEffects: true };
        }
        return undefined;
      },
    },
    load: {
      order: "pre",
      handler(id: string) {
        if (isVirtualHtmlEntry(id)) {
          return "";
        }
        return undefined;
      },
    },
    generateBundle: {
      handler(options: NormalizedOutputOptions, bundle: OutputBundle) {
        // Extract virtual HTML chunks
        const virtualChunks = new Map(
          Object.entries(bundle).filter(
            ([, chunk]) => chunk.fileName && isVirtualHtmlEntry(chunk.fileName),
          ) as [string, OutputAsset][],
        );

        // Remove virtual chunks from bundle
        for (const [key] of virtualChunks) {
          delete bundle[key];
        }

        // Store the virtualChunks in our typed plugin object
        plugin.virtualHtmlChunks = virtualChunks;
      },
    },
  };

  return plugin;
}
