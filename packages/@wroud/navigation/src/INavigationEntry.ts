import type { IRouteState } from "./IRouteState.js";

export interface INavigationEntry<TState = IRouteState> {
  readonly key: string;
  readonly state: TState | null;
}
