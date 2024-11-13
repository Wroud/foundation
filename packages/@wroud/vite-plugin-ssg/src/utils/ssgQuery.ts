import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const ssgRE = /(\?|&)ssg(?:&|$)/;
export function removeSSgQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSSgId(id: string) {
  return ssgRE.test(id);
}
