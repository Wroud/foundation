import type { IGitCommitInfo } from "@wroud/git";
import type { IConventionalCommit } from "./IConventionalCommit.js";

const headerRegex =
  /^(?<type>[\w-]+)(\((?<scope>[\w-]+)\))?(?<breaking>!)?:\s(?<description>[\S\s]*)/;

export function parseConventionalCommit(
  commitInfo: IGitCommitInfo,
): IConventionalCommit | null {
  const match = headerRegex.exec(commitInfo.subject);
  if (!match) {
    return null;
  }

  const breakingChanges: string[] = [];
  const { type, breaking, scope, description } = match.groups as {
    type: string;
    breaking?: string;
    scope?: string;
    description: string;
  };

  const rawBody = commitInfo.body?.trim() || "";

  if (breaking) {
    if (rawBody) {
      breakingChanges.push(rawBody);
    } else {
      breakingChanges.push(description);
    }
  }

  for (const trailer of commitInfo.trailers) {
    const value = trailer.value.trim();

    if (
      trailer.token === "BREAKING CHANGE" ||
      trailer.token === "BREAKING-CHANGE"
    ) {
      breakingChanges.push(value);
      continue;
    }
  }

  const body = rawBody || undefined;

  const uniqueBreakingChanges = Array.from(new Set(breakingChanges));

  return {
    commitInfo,
    type: type.toLowerCase(),
    scope: scope || undefined,
    description,
    body,
    breakingChanges: uniqueBreakingChanges,
  };
}
