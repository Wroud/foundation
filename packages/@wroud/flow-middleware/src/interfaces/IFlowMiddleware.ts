import type { IErrorMiddleware } from "./IErrorMiddleware.js";
import type { IMiddleware } from "./IMiddleware.js";
import type { IMiddlewareRequest } from "./IMiddlewareRequest.js";

export interface IFlowMiddleware<Data = Record<string, any>> {
  use(...middleware: IMiddleware<Data>[]): this;
  error(...errorMiddleware: IErrorMiddleware<Data>[]): this;

  createRequest(initialData?: Data): IMiddlewareRequest<Data>;
}
