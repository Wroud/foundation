import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const ssgRE = /(\?|&)ssr-server(?:&|$)/;
export function removeSSrServerQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSSrServerId(id: string) {
  return ssgRE.test(id);
}
