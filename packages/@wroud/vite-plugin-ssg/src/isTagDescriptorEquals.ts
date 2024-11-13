import type { HtmlTagDescriptor } from "vite";

export function isTagDescriptorEquals(
  a: HtmlTagDescriptor,
  b: HtmlTagDescriptor,
) {
  if (a.tag !== b.tag) {
    return false;
  }

  if ((a.injectTo || "head-prepend") !== (b.injectTo || "head-prepend")) {
    return false;
  }

  const aKeys = Object.keys(a.attrs || {});
  const bKeys = Object.keys(b.attrs || {});

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (a.attrs?.[key] !== b.attrs?.[key]) {
      return false;
    }
  }

  if (a.children !== b.children) {
    if (typeof a.children !== typeof b.children) {
      return false;
    }
    if (typeof a.children === "string" && a.children !== b.children) {
      return false;
    }

    if (Array.isArray(a.children) && Array.isArray(b.children)) {
      if (a.children.length !== b.children.length) {
        return false;
      }

      for (let i = 0; i < a.children.length; i++) {
        if (!isTagDescriptorEquals(a.children[i]!, b.children[i]!)) {
          return false;
        }
      }
    }
  }

  return true;
}
