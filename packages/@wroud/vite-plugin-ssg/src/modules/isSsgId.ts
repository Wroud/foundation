import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

const ssgRE = /(\?|&)ssg(?:&|$)/;
export function removeSsgQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgId(id: string) {
  return ssgRE.test(id);
}

export function createSsgId(url: string): string {
  return addQueryParam(url, "ssg");
}
