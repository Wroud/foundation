import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

const ssgClientEntryIdRe = /(\?|&)ssg-client-entry(?:&|$)/;
export function removeSsgClientEntryQuery(url: string): string {
  return url.replace(ssgClientEntryIdRe, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgClientEntryId(id: string) {
  return ssgClientEntryIdRe.test(id);
}

export function createSsgClientEntryId(url: string): string {
  return addQueryParam(url, "ssg-client-entry");
}
