import type { IConventionalCommitCoAuthor } from "./IConventionalCommitCoAuthor.js";

export interface IConventionalCommitMetadata {
  url?: string;
  coAuthors: IConventionalCommitCoAuthor[];
}
