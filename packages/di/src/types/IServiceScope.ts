import type { IServiceProvider } from "../di/IServiceProvider.js";
export interface IServiceScope {
  serviceProvider: IServiceProvider;
  [Symbol.dispose](): void;
}
