import type { INavigationEntry } from "./INavigationEntry.js";
import type { IRouteState } from "./IRouteState.js";
import type { NavigationType } from "./NavigationListener.js";

export interface NavigationTransition<TState = IRouteState> {
  readonly type: NavigationType;
  readonly from: INavigationEntry<TState> | null;
  readonly to: INavigationEntry<TState>;
  readonly index: number;
  readonly finished: Promise<boolean>;
}

export interface INavigationPlatform<TState = IRouteState> {
  commit(transition: NavigationTransition<TState>): boolean | Promise<boolean>;
}
