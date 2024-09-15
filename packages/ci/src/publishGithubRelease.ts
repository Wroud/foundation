import { Octokit } from "@octokit/rest";
import { getGitLastSemverTag, getGitPrefixedTag } from "@wroud/git";
import { readPackageJson } from "./readPackageJson.js";
import semver from "semver";
import { readChangelogForVersion } from "./readChangelogForVersion.js";

export interface IPublishGithubReleaseOptions {
  auth?: any;
  prefix?: string;
  owner: string;
  repository: string;
  dryRun?: boolean;
}

export async function publishGithubRelease({
  auth,
  prefix,
  owner,
  repository,
  dryRun,
}: IPublishGithubReleaseOptions): Promise<void> {
  console.log(`Creating GitHub release for ${owner}/${repository}`);
  const octokit = new Octokit({
    auth,
  });

  const tag = await getGitLastSemverTag({
    prefix,
  });

  if (!tag) {
    console.log("No release tag found");
    return;
  }

  if (dryRun) {
    console.log(`Checking release for tag ${tag}`);
  } else {
    const release = await octokit.repos.getReleaseByTag({
      owner,
      repo: repository,
      tag,
    });

    if (release.status === 200) {
      console.log(`Release ${tag} already exists`);
      return;
    }
  }

  const { name, version } = await readPackageJson();

  if (!version) {
    throw new Error("Version not found in package.json");
  }

  if (dryRun) {
    console.log("Check if tag matches version", tag, version);

    if (tag !== getGitPrefixedTag(version, prefix)) {
      console.error(`Tag ${tag} does not match version ${version}`);
    }
  } else {
    if (tag !== getGitPrefixedTag(version, prefix)) {
      throw new Error(`Tag ${tag} does not match version ${version}`);
    }
  }

  const body = await readChangelogForVersion({ version });

  const options = {
    owner,
    repo: repository,
    tag_name: tag,
    name: `${name}@${version}`,
    body,
    draft: false,
    prerelease: (semver.parse(version)?.prerelease || []).length > 0,
  };

  if (dryRun) {
    console.log("Creating release", options);
  } else {
    await octokit.repos.createRelease(options);
  }
  console.log(`Release ${tag} created`);
}
