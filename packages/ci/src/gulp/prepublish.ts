import { task } from "gulp";
import { execa } from "execa";
import { temporaryFile } from "tempy";
import { rename, readFile, writeFile } from "fs/promises";
import conventionalChangelog from "conventional-changelog";
import createPreset, {
  type Preset,
} from "conventional-changelog-conventionalcommits";
import { RestrictEmptyCommits } from "./RestrictEmptyCommits.js";
import { pipeline } from "stream/promises";
import { combineStreams } from "./combineStreams.js";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { githubRelease } from "@wroud/ci-github-release";

const tagPrefix = "di-v";
const commitPath = ".";
const changeLogFile = "CHANGELOG.md";
// print output of commands into the terminal
const stdio = "inherit";
const commitsConfig = { path: commitPath, ignore: /^chore: release/ };

async function bumpVersion(preset: Preset): Promise<string | null> {
  const bumper = new RestrictEmptyCommits(process.cwd())
    .loadPreset(preset)
    .tag({
      prefix: tagPrefix,
    })
    .commits(commitsConfig);

  const recommendation = await bumper.bump();

  if (!recommendation.releaseType) {
    return null;
  }

  await execa("yarn", ["version", recommendation.releaseType], {
    stdio,
  });

  return await readFile("package.json", "utf8")
    .then((data) => JSON.parse(data))
    .then((content) => content.version);
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
    commitsConfig,
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

async function commitTagPush(version: string) {
  const commitMsg = `chore: release ${version}`;
  await execa("git", ["add", "package.json", "CHANGELOG.md"], { stdio });
  await execa("git", ["commit", "--message", commitMsg], { stdio });
  await execa("git", ["tag", `${tagPrefix}${version}`], { stdio });
  await execa("git", ["push", "--follow-tags"], { stdio });
}

async function publishGithubRelease(preset: Preset) {
  const token = process.env["GITHUB_TOKEN"];
  const owner = process.env["GITHUB_REPOSITORY_OWNER"];
  const repository = process.env["GITHUB_REPOSITORY_NAME"];

  if (!token) {
    throw new Error("Expected GITHUB_TOKEN environment variable");
  }

  await githubRelease(
    { type: "oauth", token },
    { config: preset, tagPrefix },
    { owner, repository },
    commitsConfig,
  );
}

task("ci:prepublish", async () => {
  const preset = await createPreset();
  const version = await bumpVersion(preset);

  if (version === null) {
    console.log("No new version to release");
    return;
  }

  await changelog(preset, version);
  await commitTagPush(version);
  await publishGithubRelease(preset);
});
