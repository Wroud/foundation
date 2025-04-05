import type { ResolvedConfig } from "vite";
import nodePath from "node:path";

export function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  return config.base === "./" || config.base === ""
    ? nodePath.posix.join(nodePath.posix.relative(urlRelativePath, ""), "./")
    : config.base;
}
