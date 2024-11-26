import type { IMiddlewareRequest } from "./interfaces/IMiddlewareRequest.js";
import type { IMiddleware } from "./interfaces/IMiddleware.js";
import type { IFlowMiddleware } from "./interfaces/IFlowMiddleware.js";
import { MiddlewareRequest } from "./MiddlewareRequest.js";
import type { IErrorMiddleware } from "./interfaces/IErrorMiddleware.js";
import type { ILogger } from "@wroud/api-logger";

/**
 * Singleton class to register and manage middlewares.
 * @template Data - The shape of the request data.
 */
export class FlowMiddleware<Data = Record<string, any>>
  implements IFlowMiddleware<Data>
{
  private middlewares: IMiddleware<Data>[];
  private errorMiddlewares: IErrorMiddleware<Data>[];

  constructor(private readonly logger?: ILogger) {
    this.middlewares = [];
    this.errorMiddlewares = [];
  }

  /**
   * Registers a middleware globally.
   * @param {Middleware<Data>} middleware - The middleware function to register.
   */
  public use(...middleware: IMiddleware<Data>[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  /**
   * Registers an error-handling middleware globally.
   * @param {ErrorMiddleware<Data>} errorMiddleware - The error middleware function to register.
   */
  public error(...errorMiddleware: IErrorMiddleware<Data>[]): this {
    this.errorMiddlewares.push(...errorMiddleware);
    return this;
  }

  /**
   * Creates a new MiddlewareRequest instance.
   * @param {Data} initialData - Initial data for the request.
   * @returns {MiddlewareRequest<Data>} A new MiddlewareRequest instance.
   */
  public createRequest(
    initialData: Data = {} as Data,
  ): IMiddlewareRequest<Data> {
    return new MiddlewareRequest<Data>(
      this.middlewares,
      this.errorMiddlewares,
      initialData,
      this.logger,
    );
  }
}
