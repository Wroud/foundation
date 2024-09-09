import conventionalChangelog from "conventional-changelog";
import { getSemverTags } from "git-semver-tags";
import { Octokit } from "@octokit/rest";
import semver from "semver";
import { Transform } from "stream";
import { transform } from "./transform.js";

import type {
  Context,
  GitRawCommitsOptions,
  ParserOptions,
  WriterOptions,
} from "conventional-changelog-core";
import type { Context as WriterContext } from "conventional-changelog-writer";
import type { Commit } from "conventional-commits-parser";
import type { IAuthOptions } from "./IAuthOptions.js";

function log(message: string, ...args: any[]) {
  console.log(`[ci-github-releaser] ${message}`, ...args);
}

type Options<
  TCommit extends Commit = Commit,
  TContext extends WriterContext = WriterContext,
> = conventionalChangelog.Options<TCommit, TContext>;

/**
 * Create a GitHub release for the latest version in the repository.
 *
 * @param auth - The authentication options for the GitHub API.
 * @param changelogOpts - Options for the changelog generation.
 * @param context - The context object with owner and repository.
 * @param gitRawCommitsOpts - Options for git-raw-commits.
 * @param parserOpts - Options for the parser.
 * @param writerOpts - Options for the writer.
 */
export async function githubRelease<
  TCommit extends Commit = Commit,
  TContext extends WriterContext = Context,
>(
  auth: IAuthOptions,
  changelogOpts: Options<TCommit, TContext> = {},
  context: Partial<TContext> = {},
  gitRawCommitsOpts: GitRawCommitsOptions = {},
  parserOpts: ParserOptions = {},
  writerOpts: WriterOptions<TCommit, TContext> = {},
) {
  const { owner, repository } = context;
  if (!owner || !repository) {
    throw new Error("Expected context object with 'owner' and 'repository'");
  }

  log(`Creating GitHub release for ${owner}/${repository}`);
  // Initialize Octokit with authentication
  const octokit = new Octokit({ auth: auth.token });

  changelogOpts = {
    transform,
    releaseCount: 1,
    ...changelogOpts,
  };

  writerOpts.includeDetails = true;
  writerOpts.headerPartial = writerOpts.headerPartial || "";

  const tags = await getSemverTags({
    tagPrefix: changelogOpts.tagPrefix,
  });

  if (!tags?.length) {
    throw new Error("No semver tags found");
  }

  const { releaseCount = 1 } = changelogOpts;
  if (releaseCount !== 0) {
    gitRawCommitsOpts = { from: tags[releaseCount], ...gitRawCommitsOpts };
  }

  gitRawCommitsOpts.to = gitRawCommitsOpts.to || tags[0];

  await new Promise((resolve, reject) => {
    conventionalChangelog(
      changelogOpts,
      context,
      gitRawCommitsOpts,
      parserOpts,
      writerOpts,
    )
      .on("error", reject)
      .on("end", resolve)
      .pipe(
        new Transform({
          objectMode: true,
          transform(chunk, enc, callback) {
            if (!chunk.keyCommit) {
              log("Skipping chunk without keyCommit");
            }
            const version = chunk.keyCommit?.version;
            if (!version) {
              callback();
              return;
            }

            const options = {
              owner,
              repo: repository,
              tag_name: version,
              name: version,
              body: chunk.log,
              draft: false,
              prerelease: (semver.parse(version)?.prerelease || []).length > 0,
            };

            octokit.repos
              .createRelease(options)
              .then(() => callback())
              .catch(callback);
          },
        }),
      );
  });
}
