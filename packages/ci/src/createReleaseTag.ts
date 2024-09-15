import { getGitLastSemverTag, getGitPrefixedTag } from "@wroud/git";
import { execa } from "execa";
import { readPackageJson } from "./readPackageJson.js";

export interface IPushTagOptions {
  prefix?: string;
  dryRun?: boolean;
}

export async function createReleaseTag({
  prefix,
  dryRun,
}: IPushTagOptions = {}): Promise<void> {
  const lastRelease = await getGitLastSemverTag({
    prefix,
  });

  if (dryRun) {
    console.log("Last release: ", lastRelease);
  }

  const { version, name } = await readPackageJson();

  if (!version) {
    throw new Error("Version not found in package.json");
  }

  const tag = getGitPrefixedTag(version, prefix);
  if (lastRelease?.endsWith(version)) {
    console.log("Tag already exists: ", `${tag}`);
    return;
  }

  if (dryRun) {
    console.log("Create git tag: ", `${tag}`);
  } else {
    await execa(
      "git",
      ["tag", "-a", `${tag}`, "-m", `Release ${name}@${version}`],
      {
        stdout: "inherit",
      },
    );
  }

  console.log("Tag created: ", `${tag}`);
}
