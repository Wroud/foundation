import type { IServiceProvider } from "./IServiceProvider.js";

export type IServiceFactory<T> = (provider: IServiceProvider) => T;
