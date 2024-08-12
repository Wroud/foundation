import type { IAsyncServiceImplementationLoader } from "./IAsyncServiceImplementationLoader.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { ServiceImplementation } from "./ServiceImplementation.js";
import type { ServiceType } from "./ServiceType.js";

export interface IServiceCollection
  extends Iterable<IServiceDescriptor<unknown>> {
  getDescriptors<T>(service: ServiceType<T>): IServiceDescriptor<T>[];

  addScoped<T>(service: ServiceImplementation<T>): this;
  addScoped<T>(
    service: ServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addScoped<T>(
    service: ServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;

  addTransient<T>(service: ServiceImplementation<T>): this;
  addTransient<T>(
    service: ServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addTransient<T>(
    service: ServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;

  addSingleton<T>(service: ServiceImplementation<T>): this;
  addSingleton<T>(
    service: ServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addSingleton<T>(
    service: ServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;
  addSingleton<T>(
    service: ServiceType<T>,
    implementation: T | IAsyncServiceImplementationLoader<T>,
  ): this;
}
