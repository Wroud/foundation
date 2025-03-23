import { type IRoute, type IRouteOptions } from "./IRoute.js";
import type { IRouter } from "./IRouter.js";
import type { IRouteState } from "./IRouteState.js";
import type { IRouteMatcher, RouteParams } from "./IRouteMatcher.js";

export interface RouterOptions<TMatcher extends IRouteMatcher = IRouteMatcher> {
  /**
   * Matcher implementation to use for routing.
   * If not provided, basic routing will be used without pattern matching capabilities.
   * If provided, pattern-based routing will be used (route IDs are treated as patterns).
   */
  matcher?: TMatcher;
}

export class Router<TMatcher extends IRouteMatcher = IRouteMatcher>
  implements IRouter<TMatcher>
{
  get routesList(): IRoute[] {
    return Array.from(this.routes.values());
  }

  private readonly routes: Map<string, IRoute>;
  readonly matcher: TMatcher | null;

  constructor(options: RouterOptions<TMatcher> = {}) {
    this.routes = new Map();
    this.matcher = options.matcher || null;
  }

  /**
   * Add a route to the router
   */
  addRoute(route: IRouteOptions) {
    if (!route.id) {
      throw new Error("Route ID is required");
    }

    if (this.routes.has(route.id)) {
      throw new Error(`Route ${route.id} already exists`);
    }

    // If a matcher is provided, register the pattern and use it for finding parents
    if (this.matcher) {
      this.matcher.addPattern(route.id);
    }

    this.routes.set(route.id, {
      ...route,
      parents: this.getParentsForRoute(route.id),
    });
  }

  /**
   * Get a route's parent
   */
  getParentRoute(routeId: string): IRoute | undefined {
    const route = this.routes.get(routeId);

    if (!route || route.parents.length === 0) {
      return undefined;
    }

    const parentId = route.parents[route.parents.length - 1];
    return parentId ? this.routes.get(parentId) : undefined;
  }

  /**
   * Get the full route hierarchy for a route
   */
  getRouteTree(routeId: string): IRoute[] {
    const tree = [];
    const route = this.routes.get(routeId);

    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    for (const parentId of route.parents) {
      const parentRoute = this.routes.get(parentId);
      if (parentRoute) {
        tree.push(parentRoute);
      }
    }

    tree.push(route);
    return tree;
  }

  /**
   * Get a route by ID
   */
  getRoute(routeId: string): IRoute | undefined {
    return this.routes.get(routeId);
  }

  /**
   * Match a URL to a route
   */
  matchUrl(url: string): IRouteState | null {
    if (!this.matcher) {
      return null;
    }

    return this.matcher.match(url);
  }

  /**
   * Build a URL from a route ID and parameters
   */
  buildUrl(routeId: string, params: RouteParams): string | null {
    if (!this.matcher || !this.routes.has(routeId)) {
      return null;
    }

    const state: IRouteState = {
      id: routeId,
      params: params as Record<string, string>,
    };

    // Special case for root path
    if (routeId === "/") {
      return "/";
    }

    return this.matcher.stateToUrl(state);
  }

  /**
   * Convert a route state to a URL
   */
  stateToUrl(state: IRouteState): string | null {
    if (!this.matcher) {
      return null;
    }

    return this.matcher.stateToUrl(state);
  }

  /**
   * Convert a URL to a route state
   */
  urlToState(url: string): IRouteState | null {
    if (!this.matcher) {
      return null;
    }

    return this.matcher.urlToState(url);
  }

  /**
   * Calculates parent route IDs for a given route ID
   */
  private getParentsForRoute(id: string): string[] {
    // If a pattern matcher is available, use it for parents
    if (this.matcher) {
      const ancestors = this.matcher.getPatternAncestors(id);

      // Find routes that exist for these ancestors
      const existingAncestors = ancestors.filter((ancestor) =>
        this.routes.has(ancestor),
      );

      // Always include the root path first if it exists in routes and isn't already included
      if (
        this.routes.has("/") &&
        id !== "/" &&
        !existingAncestors.includes("/")
      ) {
        existingAncestors.unshift("/");
      }

      return existingAncestors;
    }

    return [];
  }
}
