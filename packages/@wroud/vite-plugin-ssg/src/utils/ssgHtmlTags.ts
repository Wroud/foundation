import { trailingSeparatorRE } from "./trailingSeparatorRE.js";

export const ssgRE = /(\?|&)ssg-html-tags(?:&|$)/;
export function removeSSgHtmlTagsQuery(url: string): string {
  return url.replace(ssgRE, "$1").replace(trailingSeparatorRE, "");
}

export function isSSgHtmlTagsId(id: string) {
  return ssgRE.test(id);
}
