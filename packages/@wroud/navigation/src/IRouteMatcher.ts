import type { IRouteState } from "./IRouteState.js";

/**
 * Primitive parameter type supported by the router.
 */
export type RouteParamValue = string | number | boolean;

/**
 * Parameter values extracted from URL routes.
 * Can be either a single primitive value or an array of primitive values for wildcard routes.
 */
export type RouteParams = Record<string, RouteParamValue | RouteParamValue[]>;

export type RouteMatcherState<T extends IRouteMatcher> = Exclude<
  ReturnType<T["match"]>,
  null
>;

/**
 * Defines the API required for route pattern matching
 */
export interface IRouteMatcher {
  isRoute(state: IRouteState | null, id: string): boolean;

  /**
   * Register a pattern with the matcher
   */
  addPattern(pattern: string): void;

  /**
   * Match a URL to a registered pattern
   */
  match(url: string): IRouteState | null;

  /**
   * Get parent patterns for a given pattern
   */
  getPatternAncestors(pattern: string): string[];

  /**
   * Convert a URL to a route state
   */
  urlToState(url: string): IRouteState | null;

  /**
   * Convert a route state to a URL
   */
  stateToUrl(state: IRouteState | null): string | null;
}
