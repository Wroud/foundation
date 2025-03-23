import type { IRouteMatcher } from "./IRouteMatcher.js";
import type { IRouter } from "./IRouter.js";
import type { IRouteState } from "./IRouteState.js";
import type { NavigationListener } from "./NavigationListener.js";

export interface INavigation<TMatcher extends IRouteMatcher = IRouteMatcher> {
  state: ReturnType<TMatcher["match"]>;
  history: IRouteState[];
  position: number;
  readonly router: IRouter<TMatcher>;
  getState(): ReturnType<TMatcher["match"]>;
  replace(state: Parameters<TMatcher["stateToUrl"]>[0]): Promise<void>;
  navigate(state: Parameters<TMatcher["stateToUrl"]>[0]): Promise<void>;
  goBack(): Promise<void>;
  addListener(listener: NavigationListener): () => void;
  removeListener(listener: NavigationListener): void;
}
