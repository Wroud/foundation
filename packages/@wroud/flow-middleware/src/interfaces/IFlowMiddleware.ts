import type { IErrorMiddleware } from "./IErrorMiddleware.js";
import type { IMiddleware } from "./IMiddleware.js";
import type { IMiddlewareRequest } from "./IMiddlewareRequest.js";

/**
 * Interface for the FlowMiddleware singleton.
 * @template Data - The shape of the request data.
 */
export interface IFlowMiddleware<Data = Record<string, any>> {
  /**
   * Registers a middleware globally.
   * @param {Middleware<Data>} middleware - The middleware function to register.
   */
  use(...middleware: IMiddleware<Data>[]): this;

  /**
   * Registers an error-handling middleware globally.
   * @param {ErrorMiddleware<Data>} errorMiddleware - The error middleware function to register.
   */
  error(...errorMiddleware: IErrorMiddleware<Data>[]): this;

  /**
   * Creates a new MiddlewareRequest instance.
   * @param {Data} initialData - Initial data for the request.
   * @returns {IMiddlewareRequest<Data>} A new MiddlewareRequest instance.
   */
  createRequest(initialData?: Data): IMiddlewareRequest<Data>;
}
