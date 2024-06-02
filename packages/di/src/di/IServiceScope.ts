import type { IServiceProvider } from "./IServiceProvider.js";
export interface IServiceScope {
  serviceProvider: IServiceProvider;
  [Symbol.dispose](): void;
}
