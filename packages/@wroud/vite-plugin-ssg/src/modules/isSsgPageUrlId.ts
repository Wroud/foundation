import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

const ssgPageIdRe = /(\?|&)page-url(?:&|$)/;
export function removeSsgPageUrlId(url: string): string {
  return url.replace(ssgPageIdRe, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgPageUrlId(id: string) {
  return ssgPageIdRe.test(id);
}

export function createSsgPageUrlId(url: string) {
  return addQueryParam(url, "page-url");
}
