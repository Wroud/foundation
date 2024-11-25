import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { IServiceImplementationResolver } from "./IServiceImplementationResolver.js";
import type { SingleServiceImplementation } from "./ServiceImplementation.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IServiceCollection
  extends Iterable<IServiceDescriptor<unknown>> {
  getDescriptor<T>(service: SingleServiceType<T>): IServiceDescriptor<T>;
  getDescriptors<T>(
    service: SingleServiceType<T>,
  ): readonly IServiceDescriptor<T>[];

  addScoped<T>(service: SingleServiceImplementation<T>): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    resolver: IServiceImplementationResolver<T>,
  ): this;

  addTransient<T>(service: SingleServiceImplementation<T>): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    resolver: IServiceImplementationResolver<T>,
  ): this;

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addSingleton<T>(service: SingleServiceType<T>, implementation: T): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    resolver: IServiceImplementationResolver<T>,
  ): this;
}
