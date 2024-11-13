import type { HtmlTagDescriptor } from "vite";
import { unescapeHtml } from "./utils/unescapeHtml.js";

// Main regex to match tag, attributes, and content
const mainRegex = /<(\w+)(\s+[^>]*?)?>([\s\S]*?)<\/\1>|<(\w+)(\s+[^>]*?)?\/?>/g;
// Secondary regex to capture each attribute within the attributes string
const attributeRegex = /(\w+)(?:="([^"]*)")?/g;

export function parseHtmlTagsFromHtml(html: string): HtmlTagDescriptor[] {
  const matches = [...html.matchAll(mainRegex)];

  const tags = matches.map<HtmlTagDescriptor>((match) => {
    const tagName = match[1] || match[4]; // Tag name
    const attributesString = match[2] || match[5] || ""; // Attributes as string
    const content = match[3] || ""; // Content

    // Extract individual attributes as an array of { name, value } pairs
    const attrs = [...attributesString.matchAll(attributeRegex)].reduce(
      (acc, [, name, value]) => ({
        ...acc,
        [name!]: unescapeHtml(value),
      }),
      {},
    );

    return {
      tag: tagName,
      attrs,
      children: content,
      injectTo: "head-prepend",
    } as HtmlTagDescriptor;
  });

  return tags;
}
