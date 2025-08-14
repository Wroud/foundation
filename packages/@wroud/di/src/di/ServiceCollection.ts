import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IServiceCollection,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceFactory,
  IServiceImplementation,
  IServiceImplementationResolver,
  SingleServiceImplementation,
  SingleServiceType,
  IServiceCollectionElement,
} from "../types/index.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { fallback } from "../implementation-resolvers/fallback.js";

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceCollectionElement<unknown>>;
  constructor(collection?: ServiceCollection) {
    this.collection = collection ? collection.copy() : new Map();
    if (!this.collection.has(IServiceProvider)) {
      this.addTransient(IServiceProvider);
    }
  }

  *[Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, undefined> {
    for (const descriptors of this.collection.values()) {
      for (const descriptor of descriptors.all) {
        yield descriptor;
      }
    }
  }

  getDescriptors<T>(
    service: SingleServiceType<T>,
  ): readonly IServiceDescriptor<T>[] {
    return (this.collection.get(service)?.all ?? []) as IServiceDescriptor<T>[];
  }

  getDescriptor<T>(service: SingleServiceType<T>): IServiceDescriptor<T> {
    const descriptor = this.collection.get(service);

    if (!descriptor) {
      let name = getNameOfServiceType(service);

      const metadata = ServiceRegistry.get(service);

      if (metadata?.name) {
        name = metadata.name;
      }

      throw new Error(`No service of type "${name}" is registered`);
    }

    return descriptor.single as IServiceDescriptor<T>;
  }

  addScoped<T>(service: SingleServiceImplementation<T>): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addScoped<
    T,
    TResolver extends IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  >(service: SingleServiceType<T>, resolver: TResolver): this;
  addScoped<T>(
    service: SingleServiceType<T>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Scoped, service, implementation);
    return this;
  }

  addTransient<T>(service: SingleServiceImplementation<T>): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addTransient<
    T,
    TResolver extends IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  >(service: SingleServiceType<T>, resolver: TResolver): this;
  addTransient<T>(
    service: SingleServiceType<T>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Transient, service, implementation);
    return this;
  }

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(service: SingleServiceType<T>, implementation: T): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    factory: IServiceFactory<T>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addSingleton<
    T,
    TResolver extends IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  >(service: SingleServiceType<T>, resolver: TResolver): this;
  addSingleton<T>(
    service: SingleServiceType<T>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Singleton, service, implementation);
    return this;
  }

  protected copy(): Map<any, IServiceCollectionElement<unknown>> {
    const newMap = new Map<any, IServiceCollectionElement<unknown>>();
    for (const [key, descriptors] of this.collection) {
      const src = descriptors.all;
      const len = src.length;
      // Pre-allocate exact size to avoid dynamic growth / copying
      const all: IServiceDescriptor<unknown>[] = new Array(len);
      for (let i = 0; i < len; i++) {
        const d = src[i]!;
        // Manual property copy is faster than object spread for small fixed objects
        all[i] = {
          lifetime: d.lifetime,
          service: d.service,
          resolver: d.resolver,
        };
      }
      newMap.set(key, { single: all[len - 1]!, all });
    }
    return newMap;
  }

  protected addService<T>(
    lifetime: ServiceLifetime,
    service: SingleServiceType<T>,
    implementation: IServiceImplementation<T>,
  ): this {
    const descriptor: IServiceDescriptor<T> = {
      lifetime,
      service,
      resolver: fallback(implementation),
    };

    let descriptors = this.collection.get(service);
    if (!descriptors) {
      this.collection.set(service, {
        single: descriptor,
        all: [descriptor],
      });
    } else {
      descriptors.all.push(descriptor);
      descriptors.single = descriptor;
    }

    return this;
  }
}
