/**
 * Type definition for an Error Middleware function.
 * @template Data - The shape of the request data.
 */
export interface IErrorMiddleware<Data = Record<string, any>> {
  (
    error: Error,
    data: Data,
    next: () => Promise<void>,
    triggerReRun: () => Promise<void>,
    subscribe: (key: string, subscribeFn: () => () => void) => void,
  ): Promise<void>;
}
