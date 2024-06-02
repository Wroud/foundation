import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export enum ServiceLifetime {
  Singleton,
  Scoped,
  Transient,
}
export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: any;
  implementation: IServiceConstructor<T> | IServiceFactory<T> | T;
}
