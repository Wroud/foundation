import type { IRouteState } from "./IRouteState.js";

export enum NavigationType {
  Navigate = "navigate",
  Replace = "replace",
  Back = "back",
  Forward = "forward",
}

export type NavigationListener = (
  type: NavigationType,
  from: IRouteState | null,
  to: IRouteState | null
) => void;
