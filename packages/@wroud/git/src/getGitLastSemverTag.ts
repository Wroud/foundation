import { defaultTagPrefix } from "./defaultTagPrefix.js";
import { getGitLastSemverTags } from "./getGitLastSemverTags.js";

interface IGitGetLastTagOptions {
  to?: string;
  prefix?: string;
}

export async function getGitLastSemverTag({
  to,
  prefix = defaultTagPrefix,
}: IGitGetLastTagOptions = {}): Promise<string | null> {
  for await (const tag of getGitLastSemverTags({ to, prefix })) {
    return tag;
  }
  return null;
}
