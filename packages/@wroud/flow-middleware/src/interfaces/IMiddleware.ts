import type { IMiddlewareSubscribe } from "./IMiddlewareSubscribe.js";

export interface IMiddleware<Data = Record<string, any>> {
  (
    data: Data,
    next: () => Promise<void>,
    triggerReRun: (error?: any) => Promise<void>,
    subscribe: IMiddlewareSubscribe,
  ): Promise<void>;
}
