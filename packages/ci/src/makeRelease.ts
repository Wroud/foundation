import { getConventionalCommitsBump } from "@wroud/conventional-commits-bump";
import {
  gitTrailersConventionalCommits,
  parseConventionalCommit,
  type IConventionalCommit,
} from "@wroud/conventional-commits-parser";
import { getGitCommits, getGitLastSemverTag } from "@wroud/git";
import { execa } from "execa";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  WriteStream,
} from "fs";
import { rename, writeFile } from "fs/promises";
import {
  createChangelogHeader,
  createConventionalChangelog,
  createConventionalChangelogHeader,
} from "@wroud/conventional-commits-changelog";
import { pipeline } from "stream/promises";
import { Readable, Transform, Writable } from "stream";
import { temporaryFile } from "tempy";
import { createInterface } from "readline";
import { markdownMarkers } from "./markdownMarkers.js";
import semver from "semver";
import { stdout } from "process";
import { readPackageJson } from "./readPackageJson.js";
import { defaultChangelogFile } from "./defaultChangelogFile.js";

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

  if (dryRun) {
    console.log("Last release: ", lastRelease);
  }

  const commits: IConventionalCommit[] = [];

  for await (const commit of getGitCommits({
    path,
    from: lastRelease,
    customTrailers: [...gitTrailersConventionalCommits],
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

  if (dryRun) {
    console.log("Bump type: ", bump);
  } else {
    await execa("yarn", ["version", bump], {
      stdout: "inherit",
    });
  }

  let { version } = await readPackageJson();

  if (!version) {
    throw new Error("Version not found in package.json");
  }

  if (dryRun) {
    version = semver.inc(version, bump)!;
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
    Readable.from(changelogHead(version, commits)).map((line) => line + "\n"),
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
        if (line === markdownMarkers.header) {
          skipping = true;
        }

        if (
          skipping &&
          (!markdownMarkers.isVersionMarker(line.toString()) ||
            markdownMarkers.version(version) === line)
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
): AsyncGenerator<string> {
  yield markdownMarkers.header;
  yield* createChangelogHeader();
  yield markdownMarkers.version(version);
  yield* createConventionalChangelogHeader(version);
  yield* createConventionalChangelog(commits);
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
