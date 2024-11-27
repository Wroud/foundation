import type { IErrorMiddleware } from "./IErrorMiddleware.js";
import type { IMiddleware } from "./IMiddleware.js";

export interface IMiddlewareContainer<Data = Record<string, any>> {
  use(...middleware: IMiddleware<Data>[]): this;
  error(...errorMiddleware: IErrorMiddleware<Data>[]): this;
}
