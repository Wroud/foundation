import type { IRoute, IRouteOptions } from "./IRoute.js";
import type { IRouteMatcher } from "./IRouteMatcher.js";
export interface IRouter<TMatcher extends IRouteMatcher = IRouteMatcher> {
  readonly routesList: IRoute[];
  readonly matcher: TMatcher | null;
  getParentRoute(routeId: string): IRoute | undefined;
  getRouteTree(routeId: string): IRoute[];
  getRoute(routeId: string): IRoute | undefined;
  addRoute(route: IRouteOptions): void;
}
