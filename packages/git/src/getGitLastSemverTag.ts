import { execa } from "execa";
import semverRegex from "semver-regex";
import { validateGitEnvironment } from "./validateGitEnvironment.js";
import { defaultTagPrefix } from "./defaultTagPrefix.js";

interface IGitGetLastTagOptions {
  to?: string;
  prefix?: string;
}

export async function getGitLastSemverTag({
  to = "HEAD",
  prefix = defaultTagPrefix,
}: IGitGetLastTagOptions = {}): Promise<string | null> {
  await validateGitEnvironment();
  try {
    for await (const tag of execa("git", [
      "tag",
      "--list",
      `${prefix}*`,
      "--merged",
      to,
      "--sort=-v:refname", // Sort tags in descending version order
    ])) {
      if (
        tag.startsWith(prefix) &&
        semverRegex().test(tag.slice(prefix.length))
      ) {
        return tag;
      }
    }
  } catch (e: any) {
    console.error(e);
  }
  return null;
}
