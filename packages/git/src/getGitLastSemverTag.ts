import { execa } from "execa";
import semverRegex from "semver-regex";
import { validateGitEnvironment } from "./validateGitEnvironment.js";
import { defaultTagPrefix } from "./defaultTagPrefix.js";

interface IGitGetLastTagOptions {
  to?: string;
  prefix?: string;
}

export async function getGitLastSemverTag({
  to,
  prefix = defaultTagPrefix,
}: IGitGetLastTagOptions = {}): Promise<string | null> {
  await validateGitEnvironment();
  try {
    const args = ["tag", "--list", `${prefix}*`];

    if (to) {
      args.push("--merged", to);
    }

    args.push("--sort=-v:refname");
    for await (const tag of execa("git", args)) {
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
