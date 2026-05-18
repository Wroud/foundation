import type { INavigation } from "../INavigation.js";
import type { IRouteMatcher } from "../IRouteMatcher.js";
import type { TriePatternMatching } from "./TriePatternMatching.js";
import type { IPatternRouteState } from "./types.js";

export interface IPatternNavigation<
  TMatcher extends IRouteMatcher = TriePatternMatching,
> extends INavigation<TMatcher> {
  replace<Pattern extends string = string>(
    state: IPatternRouteState<Pattern> | null,
  ): Promise<void>;
  navigate<Pattern extends string = string>(
    state: IPatternRouteState<Pattern> | null,
  ): Promise<void>;
}
