import type { IServiceCollection } from "../types/index.js";

export interface IModule {
  name: string;
  configure(serviceCollection: IServiceCollection): Promise<void> | void;
}
