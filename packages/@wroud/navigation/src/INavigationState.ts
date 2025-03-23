import type { IRouteState } from "./IRouteState.js";
import type { LinkedList } from "./sdk/LinkedList.js";

/**
 * Represents the internal state of navigation with history and current position
 */
export interface INavigationState {
  position: number;
  history: LinkedList<IRouteState>;
}
