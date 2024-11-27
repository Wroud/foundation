import type { IMiddlewareContainer } from "./IMiddlewareContainer.js";
import type { IMiddlewareRequest } from "./IMiddlewareRequest.js";

export interface IFlowMiddleware<Data = Record<string, any>>
  extends IMiddlewareContainer<Data> {
  createRequest(initialData?: Data): IMiddlewareRequest<Data>;
}
