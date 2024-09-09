import {
  type GetSemverTagsParams,
  type GetCommitsParams,
  type Params,
  ConventionalGitClient,
} from "@conventional-changelog/git-client";
import type { ParserStreamOptions } from "conventional-commits-parser";
import { getBumpRecommendation } from "./getBumpRecommendation.js";
import type { Bump } from "./Bump.js";

export async function getBump(
  params?: GetSemverTagsParams & { cwd?: string } & Params,
  gitCommitsParams?: GetCommitsParams,
  parserOptions?: ParserStreamOptions,
): Promise<Bump> {
  const cwd = params?.cwd || process.cwd();
  const gitClient = new ConventionalGitClient(cwd);
  const lastSemverTag = await gitClient.getLastSemverTag(params);

  const commits = gitClient.getCommits(
    {
      format: "%B%n-hash-%n%H",
      from: lastSemverTag || "",
      filterReverts: true,
      ...gitCommitsParams,
    },
    parserOptions,
  );

  return await getBumpRecommendation(commits);
}
