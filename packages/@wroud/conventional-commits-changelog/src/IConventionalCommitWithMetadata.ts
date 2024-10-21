import type { IConventionalCommit } from "@wroud/conventional-commits-parser";
import type { IConventionalCommitMetadata } from "./IConventionalCommitMetadata.js";

export interface IConventionalCommitWithMetadata extends IConventionalCommit {
  metadata?: IConventionalCommitMetadata;
}
