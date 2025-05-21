import { getConventionalCommitsBump } from "@wroud/conventional-commits-bump";
import {
  gitTrailersConventionalCommits,
  parseConventionalCommit,
  type IConventionalCommit,
} from "@wroud/conventional-commits-parser";
import {
  getGitCommits,
  getGitLastSemverTag,
  getGitPrefixedTag,
} from "@wroud/git";
import { execa } from "execa";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  WriteStream,
} from "fs";
import { rename, writeFile } from "fs/promises";
import {
  conventionalChangelogMarkers,
  createChangelogHeader,
  createConventionalChangelog,
  createConventionalChangelogHeader,
} from "@wroud/conventional-commits-changelog";
import { pipeline } from "stream/promises";
import { Readable, Transform, Writable } from "stream";
import { temporaryFile } from "tempy";
import { createInterface } from "readline";
import semver from "semver";
import { stdout } from "process";
import { readPackageJson } from "./readPackageJson.js";
import { bumpPackageVersion } from "./bumpPackageVersion.js";
import { defaultChangelogFile } from "./defaultChangelogFile.js";
import { getGithubLink, gitGithubLinks, GithubURL } from "@wroud/github";
import { getRepository } from "./config.js";

export interface IMakeReleaseOptions {
  changeLogFile?: string;
  prefix?: string;
  path?: string;
  dryRun?: boolean;
}

export async function makeRelease({
  changeLogFile = defaultChangelogFile,
  prefix,
  path,
  dryRun,
}: IMakeReleaseOptions = {}) {
  const lastRelease = await getGitLastSemverTag({
    prefix,
  });

  const repository = await getRepository();

  if (dryRun) {
    console.log("Last release: ", lastRelease);
  }

  const commits: IConventionalCommit[] = [];

  for await (const commit of getGitCommits({
    path,
    from: lastRelease,
    customTrailers: [...gitTrailersConventionalCommits],
    customLinks: [...gitGithubLinks],
  })) {
    const conventionalCommit = parseConventionalCommit(commit);

    if (conventionalCommit) {
      commits.push(conventionalCommit);
    } else if (dryRun) {
      console.warn("Skipping not conventional commit: ", commit.subject);
    }
  }

  const bump = getConventionalCommitsBump(commits);

  if (!bump) {
    console.log("No release needed");
    return;
  }

  let version: string;

  if (dryRun) {
    console.log("Bump type: ", bump);
    const pkg = await readPackageJson();
    if (!pkg.version) {
      throw new Error("Version not found in package.json");
    }
    version = semver.inc(pkg.version, bump)!;
  } else {
    version = await bumpPackageVersion(bump);
  }

  if (!existsSync(changeLogFile)) {
    if (dryRun) {
      console.log("Creating changelog file: ", changeLogFile);
    } else {
      await writeFile(changeLogFile, "");
    }
  }

  const tmpFile = temporaryFile();

  if (dryRun) {
    console.log("Writing data to: ", tmpFile);
  }

  await pipeline(
    Readable.from(
      changelogHead(version, commits, repository, lastRelease, prefix),
    ).map((line) => line + "\n"),
    mockWritableStream(dryRun, () =>
      createWriteStream(tmpFile, { flags: "w" }),
    ),
  );

  let skipping = false;
  await pipeline(
    createInterface(
      createReadStream(changeLogFile, {
        flags: "r",
      }),
    ),
    new Transform({
      transform(chunk, encoding, callback) {
        const line = chunk.toString();
        if (line === conventionalChangelogMarkers.header) {
          skipping = true;
        }

        if (
          skipping &&
          (!conventionalChangelogMarkers.isVersionMarker(line.toString()) ||
            conventionalChangelogMarkers.version(version) === line)
        ) {
          callback(null, "");
        } else {
          skipping = false;
          callback(null, line + "\n");
        }
      },
    }),
    mockWritableStream(dryRun, () =>
      createWriteStream(tmpFile, { flags: "a" }),
    ),
  );

  if (dryRun) {
    console.log(`Renaming "${tmpFile}" to "${changeLogFile}"`);
  } else {
    await rename(tmpFile, changeLogFile);
  }

  if (dryRun) {
    console.log(`Adding "${changeLogFile}" and "package.json" to git`);
  } else {
    await execa("git", ["add", changeLogFile, "package.json"], {
      stdout: "inherit",
    });
  }

  console.log("Release done");
}

async function* changelogHead(
  version: string,
  commits: IConventionalCommit[],
  repository: string | undefined,
  previousVersion?: string | null,
  tagPrefix?: string,
): AsyncGenerator<string> {
  yield* createChangelogHeader();

  yield* createConventionalChangelogHeader(
    version,
    repository
      ? getCompareUrl(
          repository,
          getGitPrefixedTag(version, tagPrefix),
          previousVersion,
        )
      : undefined,
  );
  yield* createConventionalChangelog(commits, {
    getMetadata: async (commit) => {
      return {
        url: repository
          ? GithubURL.commit(repository, commit.commitInfo.hash)
          : undefined,
        formatter(message) {
          if (repository) {
            for (const [token, link] of Object.entries(
              commit.commitInfo.links,
            )) {
              const githubLink = getGithubLink(link, repository);

              if (githubLink) {
                message = message.replaceAll(
                  token,
                  `[${token}](${githubLink})`,
                );
              }
            }
          }

          return message;
        },
      };
    },
  });
}

function mockWritableStream<T extends WriteStream>(
  dryRun: boolean | undefined,
  createWritableStream: () => T,
): T {
  if (dryRun) {
    return new Writable({
      write(chunk, encoding, callback) {
        stdout.write(chunk, encoding, callback); // Write to stdout without closing it
      },
    }) as unknown as T;
  } else {
    return createWritableStream();
  }
}

function getCompareUrl(
  repository: string,
  version: string,
  previousVersion?: string | null,
): string | undefined {
  if (!previousVersion) {
    return undefined;
  }
  return `https://github.com/${repository}/compare/${previousVersion}...${version}`;
}
