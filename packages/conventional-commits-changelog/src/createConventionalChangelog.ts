import type { IConventionalCommit } from "@wroud/conventional-commits-parser";
import type { IConventionalCommitMetadata } from "./IConventionalCommitMetadata.js";
import type { IConventionalCommitCoAuthor } from "./IConventionalCommitCoAuthor.js";
import type { IConventionalCommitWithMetadata } from "./IConventionalCommitWithMetadata.js";
import { conventionalChangelogMarkers } from "./conventionalChangelogMarkers.js";

export interface ICreateConventionalChangelogOptions {
  headlineLevel?: string;
  getMetadata?: (
    commit: IConventionalCommit,
  ) => Promise<IConventionalCommitMetadata>;
}

export async function* createConventionalChangelog(
  commits: IConventionalCommit[],
  options: ICreateConventionalChangelogOptions = {},
): AsyncGenerator<string> {
  const { headlineLevel: hl = "###", getMetadata } = options;

  let changeLogEmpty = true;
  const features: IConventionalCommitWithMetadata[] = [];
  const fixes: IConventionalCommitWithMetadata[] = [];
  const breakingChanges: IConventionalCommitWithMetadata[] = [];
  const documentation: IConventionalCommitWithMetadata[] = [];
  const refactor: IConventionalCommitWithMetadata[] = [];
  const performance: IConventionalCommitWithMetadata[] = [];
  const contributors: IConventionalCommitCoAuthor[] = [];

  for (const commit of commits) {
    let group: IConventionalCommitWithMetadata[] | undefined = undefined;

    if (commit.breakingChanges.length > 0) {
      group = breakingChanges;
    } else {
      switch (commit.type) {
        case "feat":
          group = features;
          break;
        case "fix":
          group = fixes;
          break;
        case "docs":
          group = documentation;
          break;
        case "refactor":
          group = refactor;
          break;
        case "perf":
          group = performance;
          break;
      }
    }

    if (!group) {
      continue;
    }

    changeLogEmpty = false;
    const commitWithMetadata: IConventionalCommitWithMetadata = {
      ...commit,
    };

    if (getMetadata) {
      commitWithMetadata.metadata = await getMetadata(commit);

      if (commitWithMetadata.metadata.coAuthors) {
        contributors.push(...commitWithMetadata.metadata.coAuthors);
      }
    }

    group.push(commitWithMetadata);
  }

  yield conventionalChangelogMarkers.changelog;

  if (changeLogEmpty) {
    yield "This release has no user-facing changes.";
    yield "";
    return;
  }

  if (features.length > 0) {
    yield* createSection(hl, "✨ Features");
    yield* createChangesList(features);
  }

  if (fixes.length > 0) {
    yield* createSection(hl, "🩹 Fixes");
    yield* createChangesList(fixes);
  }

  if (breakingChanges.length > 0) {
    yield* createSection(hl, "⚠️  Breaking Changes");
    yield* createChangesList(breakingChanges);
  }

  if (documentation.length > 0) {
    yield* createSection(hl, "📖 Documentation");
    yield* createChangesList(documentation);
  }

  if (refactor.length > 0) {
    yield* createSection(hl, "⚙️  Refactor");
    yield* createChangesList(refactor);
  }

  if (performance.length > 0) {
    yield* createSection(hl, "🚀 Performance");
    yield* createChangesList(performance);
  }

  if (contributors.length > 0) {
    yield* createSection(hl, "❤️  Contributors");
    yield* createContributorsList(contributors);
  }
}

function* createSection(
  headlineLevel: string,
  title: string,
): Generator<string> {
  yield `${headlineLevel} ${title}`;
  yield "";
}

function* createChangesList(
  commits: IConventionalCommitWithMetadata[],
): Generator<string> {
  for (const commit of commits) {
    let message = `- `;

    message += commit.metadata?.formatter
      ? commit.metadata.formatter(commit.description)
      : commit.description;

    if (commit.metadata?.url) {
      message += ` ([${commit.commitInfo.hash}](${commit.metadata.url}))`;
    } else {
      message += ` (${commit.commitInfo.hash})`;
    }

    yield message;

    for (const breakingChange of commit.breakingChanges) {
      const lines = formatMessage(
        commit.metadata?.formatter
          ? commit.metadata.formatter(breakingChange)
          : breakingChange,
      );
      yield `  - ${lines.shift()}`;

      for (const line of lines) {
        yield `    <br>${line}`;
      }
    }
  }
  yield "";
}

function* createContributorsList(
  contributors: IConventionalCommitCoAuthor[],
): Generator<string> {
  for (const contributor of contributors) {
    let name = contributor.name;

    if (contributor.link) {
      name = `[${name}](${contributor.link})`;
    }

    if (contributor.username) {
      if (contributor.usernameLink) {
        name += ` ([@${contributor.username}](${contributor.usernameLink}))`;
      } else {
        name += ` (@${contributor.username})`;
      }
    }

    if (!contributor.email) {
      yield `- ${name}`;
      continue;
    }

    yield `- ${name} <${contributor.email}>`;
  }
  yield "";
}

function formatMessage(message: string): string[] {
  return message.trim().split(/\n/gm);
}
