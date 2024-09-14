import type { IGitCommitInfo } from "@wroud/git";

export interface IConventionalCommit {
  commitInfo: IGitCommitInfo;
  type: string;
  scope?: string;
  description: string;
  body?: string;
  breakingChanges: string[];
}
