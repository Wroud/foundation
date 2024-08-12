import type { IServiceProvider } from "../di/IServiceProvider.js";

export type IServiceFactory<T> = (provider: IServiceProvider) => T;
