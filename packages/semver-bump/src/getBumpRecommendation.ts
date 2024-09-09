import type { Commit } from "conventional-commits-parser";
import type { Bump } from "./Bump.js";

export const breakingHeaderPattern = /^\w+?(?:\([^\(\)]+?\))?!:/gi;

export async function getBumpRecommendation(
  commits: AsyncIterable<Commit>,
): Promise<Bump> {
  let bump: Bump = null;

  for await (const commit of commits) {
    let type = commit["type"];
    const major =
      commit.header?.match(breakingHeaderPattern) ||
      commit.footer?.includes("BREAKING CHANGE") ||
      commit.footer?.includes("BREAKING-CHANGE");

    if (major) {
      type = "BREAKING CHANGE";
    }

    switch (type) {
      case "BREAKING CHANGE":
        return "major";

      case "feat":
        if (bump === null || bump === "patch") {
          bump = "minor";
        }
        break;

      case "fix":
        if (bump === null) {
          bump = "patch";
        }
        break;
    }
  }

  return bump;
}
