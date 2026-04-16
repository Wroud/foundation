import type { ResolvedConfig } from "vite";
import { mapBaseToUrl } from "./mapBaseToUrl.js";
import { stripIndexFromPath } from "./stripIndexFromPath.js";

export function getHrefFromPath(url: string, config: ResolvedConfig) {
  url = stripIndexFromPath(url);
  return new URL(mapBaseToUrl(url, config), "http://localhost/").href;
}
