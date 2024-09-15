import { defaultTagPrefix } from "./defaultTagPrefix.js";

export function getGitPrefixedTag(version: string, prefix = defaultTagPrefix) {
  return `${prefix}${version}`;
}
