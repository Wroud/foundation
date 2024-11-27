import type { IMiddlewareContainer } from "./IMiddlewareContainer.js";

export interface IMiddlewareRequest<Data = Record<string, any>>
  extends IMiddlewareContainer<Data> {
  execute(error?: any): Promise<void>;
  dispose(): void;
}
