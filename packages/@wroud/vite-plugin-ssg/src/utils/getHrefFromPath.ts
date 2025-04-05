import type { ResolvedConfig } from "vite";
import { mapBaseToUrl } from "./mapBaseToUrl.js";

export function getHrefFromPath(url: string, config: ResolvedConfig) {
  url = url.replace(/\/index([^\/]|$)/, "/$1");
  return new URL(mapBaseToUrl(url, config), "http://localhost/").href;
}
