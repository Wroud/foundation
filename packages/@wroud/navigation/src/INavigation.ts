import type { IRouteMatcher, RouteMatcherState } from "./IRouteMatcher.js";
import type { IRouter } from "./IRouter.js";
import type { NavigationListener } from "./NavigationListener.js";

export interface INavigation<TMatcher extends IRouteMatcher = IRouteMatcher> {
  state: RouteMatcherState<TMatcher> | null;
  history: RouteMatcherState<TMatcher>[];
  position: number;
  readonly router: IRouter<TMatcher>;
  getState(): RouteMatcherState<TMatcher> | null;
  replace(state: RouteMatcherState<TMatcher> | null): Promise<void>;
  navigate(state: RouteMatcherState<TMatcher> | null): Promise<void>;
  goBack(): Promise<void>;
  addListener(listener: NavigationListener): () => void;
  removeListener(listener: NavigationListener): void;
}
