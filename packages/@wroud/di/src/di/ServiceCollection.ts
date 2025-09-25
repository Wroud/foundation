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
} from "../types/index.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { fallback } from "../implementation-resolvers/fallback.js";

const EMPTY_DESCRIPTORS: IServiceDescriptor<unknown>[] = [];

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceDescriptor<unknown>[]>;
  constructor(collection?: ServiceCollection) {
    this.collection = collection ? collection.copy() : new Map();
    if (!this.collection.has(IServiceProvider)) {
      this.addTransient(IServiceProvider);
    }
  }

  *[Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, undefined> {
    for (const descriptors of this.collection.values()) {
      yield* descriptors;
    }
  }

  getDescriptors<T>(
    service: SingleServiceType<T, any[]>,
  ): readonly IServiceDescriptor<T>[] {
    return (this.collection.get(service) ??
      EMPTY_DESCRIPTORS) as IServiceDescriptor<T>[];
  }

  getDescriptor<T>(
    service: SingleServiceType<T, any[]>,
  ): IServiceDescriptor<T> {
    const descriptors = this.collection.get(service);

    if (descriptors) {
      return descriptors[descriptors.length - 1] as IServiceDescriptor<T>;
    }

    let name = getNameOfServiceType(service);

    const metadata = ServiceRegistry.get(service);

    if (metadata?.name) {
      name = metadata.name;
    }

    throw new Error(`No service of type "${name}" is registered`);
  }

  addScoped<T>(service: SingleServiceImplementation<T>): this;
  addScoped<T>(
    service: SingleServiceType<T, any[]>,
    factory: IServiceFactory<T>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T, any[]>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T, any[]>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;
  addScoped<T>(
    service: SingleServiceType<T, any[]>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Scoped, service, implementation);
    return this;
  }

  addTransient<T>(service: SingleServiceImplementation<T>): this;
  addTransient<T>(
    service: SingleServiceType<T, any[]>,
    factory: IServiceFactory<T>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T, any[]>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T, any[]>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;
  addTransient<T>(
    service: SingleServiceType<T, any[]>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Transient, service, implementation);
    return this;
  }

  addSingleton<T>(service: SingleServiceImplementation<T>): this;
  addSingleton<T>(
    service: SingleServiceType<T, any[]>,
    implementation: T,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T, any[]>,
    factory: IServiceFactory<T>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T, any[]>,
    constructor: IServiceConstructor<T, any[]>,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T, any[]>,
    resolver: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ): this;
  addSingleton<T>(
    service: SingleServiceType<T, any[]>,
    implementation: IServiceImplementation<T> = service as SingleServiceImplementation<T>,
  ): this {
    this.addService(ServiceLifetime.Singleton, service, implementation);
    return this;
  }

  protected copy(): Map<any, IServiceDescriptor<unknown>[]> {
    const newMap = new Map<any, IServiceDescriptor<unknown>[]>();
    for (const [key, descriptors] of this.collection) {
      const len = descriptors.length;
      // Pre-allocate exact size to avoid dynamic growth / copying
      const all: IServiceDescriptor<unknown>[] = new Array(len);
      for (let i = 0; i < len; i++) {
        const d = descriptors[i]!;
        // Manual property copy is faster than object spread for small fixed objects
        all[i] = {
          lifetime: d.lifetime,
          service: d.service,
          resolver: d.resolver,
        };
      }
      newMap.set(key, all);
    }
    return newMap;
  }

  protected addService<T>(
    lifetime: ServiceLifetime,
    service: SingleServiceType<T, any[]>,
    implementation: IServiceImplementation<T>,
  ): this {
    const descriptor: IServiceDescriptor<T> = {
      lifetime,
      service,
      resolver: fallback(implementation),
    };

    let descriptors = this.collection.get(service);
    if (descriptors) {
      descriptors.push(descriptor);
    } else {
      this.collection.set(service, [descriptor]);
    }

    return this;
  }
}
