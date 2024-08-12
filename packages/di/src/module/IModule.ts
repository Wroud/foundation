import type { IServiceCollection } from "../interfaces/IServiceCollection.js";

export interface IModule {
  name: string;
  configure(serviceCollection: IServiceCollection): Promise<void>;
}
