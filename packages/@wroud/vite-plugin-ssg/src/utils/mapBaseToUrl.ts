import type { ResolvedConfig } from "vite";
import nodePath from "node:path";

export function mapBaseToUrl(url: string, config: ResolvedConfig) {
  if (config.base === "./" || config.base === "") {
    return url;
  }

  return nodePath.posix.join(config.base, url);
}
