import { withTrailingSlash } from "./withTrailingSlash.js";

export function stripBase(path: string, base: string): string {
  if (path === base) {
    return "/";
  }
  const devBase = withTrailingSlash(base);
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path;
}
