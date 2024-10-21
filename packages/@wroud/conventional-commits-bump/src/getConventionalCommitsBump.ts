import type { IConventionalCommit } from "@wroud/conventional-commits-parser";

export function getConventionalCommitsBump(
  commits: IConventionalCommit[],
): "major" | "minor" | "patch" | null {
  let bump: "minor" | "patch" | null = null;

  for (const commit of commits) {
    if (commit.breakingChanges.length > 0) {
      return "major";
    }

    if (commit.type === "feat") {
      bump = "minor";
    } else if (commit.type === "fix" && bump !== "minor") {
      bump = "patch";
    }
  }

  return bump;
}
