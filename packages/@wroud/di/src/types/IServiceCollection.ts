import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { IServiceImplementationResolver } from "./IServiceImplementationResolver.js";
import type { SingleServiceImplementation } from "./ServiceImplementation.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IServiceCollection
  extends Iterable<IServiceDescriptor<unknown>> {
  getDescriptor<T>(service: SingleServiceType<T, any>): IServiceDescriptor<T>;
  getDescriptors<T>(
    service: SingleServiceType<T, any>,
  ): readonly IServiceDescriptor<T>[];

  addScoped<T>(service: SingleServiceImplementation<T>): this;
  addScoped<T>(
    service: SingleServiceType<T, any>,
    factory: IServiceFactory<T>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T, any>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T, any>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;

  addTransient<T>(service: SingleServiceImplementation<T>): this;
  addTransient<T>(
    service: SingleServiceType<T, any>,
    factory: IServiceFactory<T>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T, any>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T, any>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(
    service: SingleServiceType<T, any>,
    factory: IServiceFactory<T>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T, any>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addSingleton<T>(service: SingleServiceType<T, any>, implementation: T): this;
  addSingleton<T>(
    service: SingleServiceType<T, any>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;
}
