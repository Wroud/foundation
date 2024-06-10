import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { ServiceType } from "./ServiceType.js";

export enum ServiceLifetime {
  Singleton,
  Scoped,
  Transient,
}
export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: ServiceType<T>;
  implementation: IServiceConstructor<T> | IServiceFactory<T> | T;
}
