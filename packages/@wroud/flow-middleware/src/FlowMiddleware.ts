import type { IMiddlewareRequest } from "./interfaces/IMiddlewareRequest.js";
import type { IMiddleware } from "./interfaces/IMiddleware.js";
import type { IFlowMiddleware } from "./interfaces/IFlowMiddleware.js";
import { MiddlewareRequest } from "./MiddlewareRequest.js";
import type { IErrorMiddleware } from "./interfaces/IErrorMiddleware.js";
import type { ILogger } from "@wroud/api-logger";

export class FlowMiddleware<Data = Record<string, any>>
  implements IFlowMiddleware<Data>
{
  private middlewares: IMiddleware<Data>[];
  private errorMiddlewares: IErrorMiddleware<Data>[];

  constructor(private readonly logger?: ILogger) {
    this.middlewares = [];
    this.errorMiddlewares = [];
  }

  public use(...middleware: IMiddleware<Data>[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  public error(...errorMiddleware: IErrorMiddleware<Data>[]): this {
    this.errorMiddlewares.push(...errorMiddleware);
    return this;
  }

  public createRequest(
    initialData: Data = {} as Data,
  ): IMiddlewareRequest<Data> {
    return new MiddlewareRequest<Data>(
      [...this.middlewares],
      [...this.errorMiddlewares],
      initialData,
      this.logger,
    );
  }
}
