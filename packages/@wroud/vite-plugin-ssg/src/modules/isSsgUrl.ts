import path from "node:path";
import { getPageName } from "../utils/getPageName.js";

export function removeSsgUrl(url: string): string {
  return getPageName(url.replace("/@ssg/", ""));
}

export function isSsgUrl(id: string) {
  return id.startsWith("/@ssg/");
}

export function createSsgUrl(url: string) {
  return path.posix.join("/@ssg/", url);
}
