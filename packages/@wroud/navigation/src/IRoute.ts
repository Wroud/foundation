import type { IRouteState } from "./IRouteState.js";

export type RouteActivationFn = (
  toRoute: IRouteState,
  fromRoute: IRouteState | null
) => boolean | Promise<boolean>;

export type RouteDeActivationFn = (
  toRoute: IRouteState | null,
  fromRoute: IRouteState | null
) => boolean | Promise<boolean>;

export interface IRoute {
  id: string;
  parents: string[];
  canActivate?: RouteActivationFn;
  canDeactivate?: RouteDeActivationFn;
}

export interface IRouteOptions extends Omit<IRoute, "parents"> {}
