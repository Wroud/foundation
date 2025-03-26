import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const urlRE = /(\?|&)no-inline(?:&|$)/;
export function removeNoInlineQuery(url: string): string {
  return url.replace(urlRE, "$1").replace(trailingSeparatorRE, "");
}

export function isNoInlineId(id: string) {
  return urlRE.test(id);
}
