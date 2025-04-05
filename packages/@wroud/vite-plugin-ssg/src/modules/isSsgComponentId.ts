import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

const ssgComponentIdRe = /(\?|&)ssg-component(?:&|$)/;
export function removeSsgComponentQuery(url: string): string {
  return url.replace(ssgComponentIdRe, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgComponentId(id: string) {
  return ssgComponentIdRe.test(id);
}

export function createSsgComponentId(url: string): string {
  return addQueryParam(url, "ssg-component");
}
