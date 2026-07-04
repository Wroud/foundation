/**
 * Represents the state of a route with its ID and parameters
 */
export interface IRouteState {
  id: string;
  params: Record<string, string | string[]>;
  hash?: string;
  /**
   * Query pairs from the matched URL that are not declared in the pattern,
   * kept verbatim without the leading "?" (e.g. "gclid=x&utm_source=y").
   * Populated by match()/urlToState() and re-emitted by stateToUrl() after
   * the declared query parameters.
   */
  unknownQuery?: string;
}
