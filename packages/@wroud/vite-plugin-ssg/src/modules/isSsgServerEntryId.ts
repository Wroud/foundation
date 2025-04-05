import { addQueryParam } from "../utils/queryParam.js";
import { trailingSeparatorRE } from "../utils/trailingSeparatorRE.js";

const ssgRE = /(\?|&)ssr-server-entry(?:&|$)/;
export function removeSsgServerEntryQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSsgServerEntryId(id: string) {
  return ssgRE.test(id);
}

export function createSsgServerEntryId(url: string): string {
  return addQueryParam(url, "ssr-server-entry");
}
