import path from "node:path";
import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export function removeSsgUrl(url: string): string {
  return url.slice(6).replace(trailingSeparatorRE, "");
}

export function isSsgUrl(id: string) {
  return id.startsWith("/@ssg/");
}

export function createSsgUrl(url: string) {
  return path.posix.join("/@ssg/", url);
}
