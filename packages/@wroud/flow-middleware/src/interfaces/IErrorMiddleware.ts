import type { IMiddlewareSubscribe } from "./IMiddlewareSubscribe.js";

/**
 * Type definition for an Error Middleware function.
 * @template Data - The shape of the request data.
 */
export interface IErrorMiddleware<Data = Record<string, any>> {
  (
    error: Error,
    data: Data,
    next: () => Promise<void>,
    triggerReRun: (error?: any) => Promise<void>,
    subscribe: IMiddlewareSubscribe,
  ): Promise<void>;
}
