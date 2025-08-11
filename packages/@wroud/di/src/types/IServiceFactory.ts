import type { IServiceProvider } from "../di/IServiceProvider.js";

export type IServiceFactory<
  T,
  TArgs extends unknown[] = [provider: IServiceProvider],
> = (...args: TArgs) => T;
