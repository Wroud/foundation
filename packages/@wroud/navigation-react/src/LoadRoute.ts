import type { IRouteState, NavigationType } from "@wroud/navigation";

export type LoadRoute = (
  to: IRouteState,
  from: IRouteState | null,
  type: NavigationType,
) => Promise<void> | void;
