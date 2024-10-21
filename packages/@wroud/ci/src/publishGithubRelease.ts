import { Octokit } from "@octokit/rest";
import { getGitLastSemverTags, getGitPrefixedTag } from "@wroud/git";
import { readPackageJson } from "./readPackageJson.js";
import semver from "semver";
import { readChangelogForVersion } from "./readChangelogForVersion.js";
import { execa } from "execa";

export interface IPublishGithubReleaseOptions {
  auth?: any;
  authStrategy?: any;
  prefix?: string;
  owner: string;
  repository: string;
  dryRun?: boolean;
}

export async function publishGithubRelease({
  auth,
  authStrategy,
  prefix,
  owner,
  repository,
  dryRun,
}: IPublishGithubReleaseOptions): Promise<void> {
  console.log(`Creating GitHub release for ${owner}/${repository} ${prefix}`);
  const octokit = new Octokit({
    auth,
    authStrategy,
  });

  const tagsToRelease: string[] = [];

  for await (const tag of getGitLastSemverTags({
    prefix,
  })) {
    if (dryRun) {
      console.log(`Checking release for tag ${tag}`);
      tagsToRelease.push(tag);
      break;
    } else {
      try {
        const release = await octokit.repos.getReleaseByTag({
          owner,
          repo: repository,
          tag,
        });

        if (release.status === 200) {
          console.log(`Release ${tag} already exists`);
          break;
        }
      } catch (e: any) {
        if (e.status !== 404) {
          throw e;
        }
        tagsToRelease.push(tag);
      }
    }
  }

  if (!tagsToRelease.length) {
    console.log("No tags to release");
    return;
  }

  tagsToRelease.reverse();

  for (const tag of tagsToRelease) {
    await execa("git", ["checkout", tag]);
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
    console.log(`${options.name} released`);
  }
}
