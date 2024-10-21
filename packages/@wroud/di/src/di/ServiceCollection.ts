import type {
  IAsyncServiceImplementationLoader,
  IServiceCollection,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceFactory,
  SingleServiceImplementation,
  SingleServiceType,
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

  getDescriptors<T>(service: SingleServiceType<T>): IServiceDescriptor<T>[] {
    return (this.collection.get(service) ?? []) as IServiceDescriptor<T>[];
  }

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
  addScoped<T>(
    service: SingleServiceType<T>,
    implementation:
      | SingleServiceImplementation<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>
      | IAsyncServiceImplementationLoader<
          IServiceConstructor<T>
        > = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Scoped, service, implementation);
    return this;
  }

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
  addTransient<T>(
    service: SingleServiceType<T>,
    implementation:
      | SingleServiceImplementation<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>
      | IAsyncServiceImplementationLoader<
          IServiceConstructor<T>
        > = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Transient, service, implementation);
    return this;
  }

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    implementation: T | IAsyncServiceImplementationLoader<T>,
  ): this;
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
    implementation:
      | SingleServiceImplementation<T>
      | IAsyncServiceImplementationLoader<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>
      | T = service as SingleServiceImplementation<T>,
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
    service: SingleServiceType<T>,
    implementation:
      | SingleServiceImplementation<T>
      | IAsyncServiceImplementationLoader<T>
      | IAsyncServiceImplementationLoader<IServiceFactory<T>>
      | IAsyncServiceImplementationLoader<IServiceConstructor<T>>
      | T,
  ): this {
    const descriptors = this.collection.get(service) ?? [];
    this.collection.set(service, [
      ...descriptors,
      {
        service,
        lifetime,
        implementation,
      },
    ]);

    if (Debug.extended) {
      tryResolveService(this, service, new Set());
    }

    return this;
  }
}
