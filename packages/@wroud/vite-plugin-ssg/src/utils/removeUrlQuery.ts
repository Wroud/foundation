import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const urlRE = /(\?|&)url(?:&|$)/;
export function removeUrlQuery(url: string): string {
  return url.replace(urlRE, "$1").replace(trailingSeparatorRE, "");
}

export function isUrlId(id: string) {
  return urlRE.test(id);
}
