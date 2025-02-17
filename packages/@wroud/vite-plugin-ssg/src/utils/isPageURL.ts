import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const pageUrlRe = /(\?|&)page-url(?:&|$)/;
export function removePageURL(url: string): string {
  return url.replace(pageUrlRe, "$1").replace(trailingSeparatorRE, "");
}

export function isPageURL(id: string) {
  return pageUrlRe.test(id);
}
