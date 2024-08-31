import type {
  IAsyncServiceImplementationLoader,
  IServiceCollection,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceFactory,
  IServiceImplementation,
  ServiceImplementation,
  ServiceType,
} from "../types/index.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { tryResolveService } from "./validation/tryResolveService.js";
import { Debug } from "../debug.js";

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceDescriptor<unknown>[]>;
  constructor(collection?: ServiceCollection) {
    this.collection = new Map(collection?.copy() || []);
    if (!this.collection.has(IServiceProvider)) {
      this.addSingleton(IServiceProvider, function IServiceProvider() {
        throw new Error("Not implemented");
      });
    }
  }

  *[Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, undefined> {
    for (const descriptors of this.collection.values()) {
      for (const descriptor of descriptors) {
        yield descriptor;
      }
    }
  }

  getDescriptors<T>(service: ServiceType<T>): IServiceDescriptor<T>[] {
    return (this.collection.get(service) ?? []) as IServiceDescriptor<T>[];
  }

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
  addScoped<T>(
    service: ServiceType<T>,
    implementation?: IServiceImplementation<T>,
  ): this {
    if (implementation === undefined) {
      implementation = service as IServiceImplementation<T>;
    }
    this.addService(ServiceLifetime.Scoped, service, implementation);
    return this;
  }

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
  addTransient<T>(
    service: ServiceType<T>,
    implementation: ServiceType<T> | T = service,
  ): this {
    this.addService(ServiceLifetime.Transient, service, implementation);
    return this;
  }

  addSingleton<T>(service: ServiceImplementation<T>): this;
  addSingleton<T>(
    service: ServiceType<T>,
    implementation: T | IAsyncServiceImplementationLoader<T>,
  ): this;
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
    implementation: ServiceType<T> | T = service,
  ): this {
    this.addService(ServiceLifetime.Singleton, service, implementation);
    return this;
  }

  protected *copy(): Iterable<[any, IServiceDescriptor<unknown>[]]> {
    for (const [key, descriptors] of this.collection) {
      yield [key, [...descriptors]];
    }
  }

  private addService<T>(
    lifetime: ServiceLifetime,
    service: ServiceType<T>,
    implementation: ServiceType<T> | T,
  ): this {
    const descriptors = this.collection.get(service) ?? [];
    this.collection.set(service, [
      ...descriptors,
      {
        service,
        lifetime,
        implementation,
        loader: null,
      },
    ]);

    if (Debug.extended) {
      tryResolveService(this, service, new Set());
    }

    return this;
  }
}
