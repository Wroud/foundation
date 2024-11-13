import type { HtmlTagDescriptor } from "vite";
import { mapHtmlAttributeToReactProps } from "./mapHtmlAttributeToReactProps.js";

export function mapHtmlTagsToReactTags(tags: HtmlTagDescriptor[]) {
  return tags.map((tag) => ({
    ...tag,
    attrs: mapHtmlAttributeToReactProps(tag.attrs),
  }));
}
