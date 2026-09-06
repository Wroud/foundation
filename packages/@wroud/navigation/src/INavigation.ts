import type { INavigationEntry } from "./INavigationEntry.js";
import type { INavigationPlatform } from "./INavigationPlatform.js";
import type { IRouteMatcher, RouteMatcherState } from "./IRouteMatcher.js";
import type { IRouter } from "./IRouter.js";
import type { NavigationListener } from "./NavigationListener.js";

export interface INavigation<TMatcher extends IRouteMatcher = IRouteMatcher> {
  readonly router: IRouter<TMatcher>;
  readonly state: RouteMatcherState<TMatcher> | null;
  readonly history: (RouteMatcherState<TMatcher> | null)[];
  readonly entries: readonly INavigationEntry<RouteMatcherState<TMatcher>>[];
  readonly position: number;
  readonly currentEntry: INavigationEntry<RouteMatcherState<TMatcher>> | null;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  getState(): RouteMatcherState<TMatcher> | null;
  navigate(state: RouteMatcherState<TMatcher> | null): Promise<boolean>;
  replace(state: RouteMatcherState<TMatcher> | null): Promise<boolean>;
  goBack(): Promise<boolean>;
  goForward(): Promise<boolean>;
  go(delta: number): Promise<boolean>;
  traverseTo(key: string): Promise<boolean>;
  setPlatform(
    platform: INavigationPlatform<RouteMatcherState<TMatcher>> | null,
  ): void;
  addListener(listener: NavigationListener): () => void;
  removeListener(listener: NavigationListener): void;
}
