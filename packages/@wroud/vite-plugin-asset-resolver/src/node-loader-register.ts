import { register } from "node:module";
import type { IResolveAssetsOptions } from "./IResolveAssetsOptions.js";

/**
 * Register the asset resolver loader with Node.js
 * This should be called before any modules that might need asset resolution
 * 
 * @param options - Asset resolver configuration options
 */
export function registerAssetResolver(options?: IResolveAssetsOptions): void {
  // Store options in a global location that the loader can access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__ASSET_RESOLVER_OPTIONS__ = options;
  }

  // Register the loader
  register("./loader.js", import.meta.url);
}

/**
 * Get the globally stored options for the asset resolver
 * This is used internally by the loader
 */
export function getGlobalOptions(): IResolveAssetsOptions | undefined {
  if (typeof globalThis !== 'undefined') {
    return (globalThis as any).__ASSET_RESOLVER_OPTIONS__;
  }
  return undefined;
}
