#!/usr/bin/env node

/**
 * Node.js loader registration CLI for asset resolver
 * Usage: node --loader @wroud/vite-plugin-asset-resolver/loader your-script.js
 * Or with custom options:
 * ASSET_RESOLVER_OPTIONS='{"dist":["build"],"src":["source"]}' node --loader @wroud/vite-plugin-asset-resolver/loader your-script.js
 */

import { getGlobalOptions } from "./node-loader-register.js";

// Check if options are provided via environment variable
if (process.env["ASSET_RESOLVER_OPTIONS"]) {
  try {
    const options = JSON.parse(process.env["ASSET_RESOLVER_OPTIONS"]!);
    if (typeof globalThis !== "undefined") {
      (globalThis as any).__ASSET_RESOLVER_OPTIONS__ = options;
    }
  } catch (error) {
    console.warn(
      "Warning: Failed to parse ASSET_RESOLVER_OPTIONS environment variable:",
      error,
    );
  }
}

console.log(
  "Asset resolver loader registered with options:",
  getGlobalOptions(),
);
