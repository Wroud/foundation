import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const ssgRE = /(\?|&)ssr-client(?:&|$)/;
export function removeSSrClientQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSSrClientId(id: string) {
  return ssgRE.test(id);
}
