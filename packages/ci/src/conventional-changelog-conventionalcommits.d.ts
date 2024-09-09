declare module "conventional-changelog-conventionalcommits" {
  import type { ParserStreamOptions } from "conventional-commits-parser";
  import type {
    GetCommitsParams,
    Params,
  } from "@conventional-changelog/git-client";
  import type { Options } from "conventional-changelog-core";

  export type Preset = Options.Config & {
    commits?: GetCommitsParams & Params;
    parser?: ParserStreamOptions;
  };

  export default function createPreset(options?: any): Promise<Preset>;
}
