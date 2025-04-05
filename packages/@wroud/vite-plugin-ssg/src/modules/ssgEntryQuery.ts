import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

export const ssgEntryQueryRE = /(\?|&)ssg-entry(?:&|$)/;
export function removeSsgEntryQuery(url: string): string {
  return url.replace(ssgEntryQueryRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgEntryQuery(id: string) {
  return ssgEntryQueryRE.test(id);
}

export function createSsgEntryQuery(url: string) {
  return addQueryParam(url, "ssg-entry");
}
