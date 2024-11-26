/**
 * Type definition for a Middleware function.
 * @template Data - The shape of the request data.
 */
export interface IMiddleware<Data = Record<string, any>> {
  (
    data: Data,
    next: () => Promise<void>,
    triggerReRun: () => Promise<void>,
    subscribe: (key: string, subscribeFn: () => () => void) => void,
  ): Promise<void>;
}
