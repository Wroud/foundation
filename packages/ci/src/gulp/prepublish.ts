import { task } from "gulp";
import { execa } from "execa";
import { temporaryFile } from "tempy";
import { rename, readFile, writeFile } from "fs/promises";
import conventionalChangelog from "conventional-changelog";
import createPreset, {
  type Preset,
} from "conventional-changelog-conventionalcommits";
import { pipeline } from "stream/promises";
import { combineStreams } from "./combineStreams.js";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { githubRelease } from "@wroud/ci-github-release";
import type { IPackageJson } from "./IPackageJson.js";
import { getBump } from "@wroud/semver-bump";
import type { GetCommitsParams } from "@conventional-changelog/git-client";

const tagPrefix = "di-v";
const commitPath = ".";
const changeLogFile = "CHANGELOG.md";
// print output of commands into the terminal
const stdio = "inherit";
const commitsConfig: GetCommitsParams = {
  path: commitPath,
};

async function readPackageJson(): Promise<IPackageJson> {
  return await readFile("package.json", "utf8").then((data) =>
    JSON.parse(data),
  );
}

async function bumpVersion(preset: Preset): Promise<string | null> {
  const bump = await getBump(
    { prefix: tagPrefix },
    { ...preset.commits, ...commitsConfig },
  );

  if (!bump) {
    return null;
  }

  await execa("yarn", ["version", bump], {
    stdio,
  });

  return await readPackageJson().then((content) => content.version || null);
}

async function changelog(preset: Preset, version: string) {
  if (!existsSync(changeLogFile)) {
    await writeFile(changeLogFile, "", "utf8");
  }

  const changelogStream = conventionalChangelog(
    {
      config: preset,
      tagPrefix,
    },
    undefined,
    { path: commitPath },
  );

  const combinedStream = combineStreams(
    changelogStream,
    createReadStream(changeLogFile),
  );

  const tmp = temporaryFile();

  await pipeline(combinedStream, createWriteStream(tmp, { flags: "w" }));
  await rename(tmp, changeLogFile);

  return version;
}

async function commitTagPush(version: string, packageName: string) {
  const commitMsg = `chore: release ${packageName}@${version}`;
  await execa("git", ["add", "package.json", "CHANGELOG.md"], { stdio });
  await execa("git", ["commit", "--message", commitMsg], { stdio });
  await execa("git", ["tag", "-a", `${tagPrefix}${version}`, "-m", commitMsg], {
    stdio,
  });
  await execa("git", ["push", "--follow-tags"], { stdio });
}

async function publishGithubRelease(preset: Preset, packageName: string) {
  const token = process.env["GITHUB_TOKEN"];
  const [owner, repository] =
    process.env["GITHUB_REPOSITORY"]?.split("/") || [];

  if (!token) {
    throw new Error("Expected GITHUB_TOKEN environment variable");
  }

  await githubRelease(
    packageName,
    { type: "oauth", token },
    { config: preset, tagPrefix },
    { owner, repository },
    { path: commitPath },
  );
}

task("ci:prepublish", async () => {
  const packageJson = await readPackageJson();
  const preset = await createPreset();
  const version = await bumpVersion(preset);

  if (version === null) {
    console.log("No new version to release");
    return;
  }

  await changelog(preset, version);
  await commitTagPush(version, packageJson.name);
  await publishGithubRelease(preset, packageJson.name);
});
