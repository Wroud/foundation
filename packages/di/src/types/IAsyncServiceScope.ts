import type { IServiceProvider } from "../di/IServiceProvider.js";

export interface IAsyncServiceScope {
  serviceProvider: IServiceProvider;
  [Symbol.asyncDispose](): Promise<void>;
}
