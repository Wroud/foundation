/**
 * Represents the state of a route with its ID and parameters
 */
export interface IRouteState {
  id: string;
  params: Record<string, string | string[]>;
}
