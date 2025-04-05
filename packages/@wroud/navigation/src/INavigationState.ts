import type { IRouteState } from "./IRouteState.js";
import type { LinkedList } from "./sdk/LinkedList.js";

/**
 * Represents the internal state of navigation with history and current position
 */
export interface INavigationState<TState = IRouteState> {
  position: number;
  history: LinkedList<TState>;
}
