import type { IAsyncServiceImplementationLoader } from "./IAsyncServiceImplementationLoader.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { SingleServiceImplementation } from "./ServiceImplementation.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IServiceCollection
  extends Iterable<IServiceDescriptor<unknown>> {
  getDescriptors<T>(service: SingleServiceType<T>): IServiceDescriptor<T>[];

  addScoped<T>(service: SingleServiceImplementation<T>): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;

  addTransient<T>(service: SingleServiceImplementation<T>): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    factory:
      | IServiceFactory<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    constructor:
      | IServiceConstructor<T>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    implementation: T | IAsyncServiceImplementationLoader<T>,
  ): this;
}
