import type { NavigationTransition } from "../INavigationPlatform.js";
import type { IRouteState } from "../IRouteState.js";

export type Transition = NavigationTransition<IRouteState>;

export interface Inbound {
  traverse(key: string): Promise<Transition | null>;
  adopt(url: string, replace: boolean): Promise<Transition | null>;
  request(url: string, replace: boolean): boolean;
}

export interface Platform {
  readonly key: string | null;
  knows(key: string): boolean;
  push(transition: Transition, url: string | null): Promise<boolean>;
  traverse(transition: Transition): Promise<boolean>;
  stay(transition: Transition, url: string | null): Promise<boolean>;
  revert(key: string): void;
  attach(inbound: Inbound): void;
  detach(): void;
}
