import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

export const ssgMainRE = /(\?|&)ssg-main(?:&|$)/;
export function removeMainQuery(url: string): string {
  return url.replace(ssgMainRE, "$1").replace(trailingSeparatorRE, "");
}

export function isMainId(id: string) {
  return ssgMainRE.test(id);
}

export function addMainQuery(id: string) {
  return addQueryParam(id, "ssg-main");
}
