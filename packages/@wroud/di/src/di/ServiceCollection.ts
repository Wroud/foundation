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
import { isServiceImplementationResolver } from "../implementation-resolvers/BaseServiceImplementationResolver.js";
import { RegistryServiceImplementationResolver } from "../implementation-resolvers/RegistryServiceImplementationResolver.js";
import { ValueServiceImplementationResolver } from "../implementation-resolvers/ValueServiceImplementationResolver.js";

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceCollectionElement<unknown>>;
  constructor(collection?: ServiceCollection) {
    this.collection = new Map(collection?.copy() || []);
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
    constructor: IServiceConstructor<T>,
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
    constructor: IServiceConstructor<T>,
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
    constructor: IServiceConstructor<T>,
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

  protected *copy(): Iterable<[any, IServiceCollectionElement<unknown>]> {
    for (const [key, descriptors] of this.collection) {
      const all = [...descriptors.all.map((d) => ({ ...d }))];
      yield [
        key,
        {
          single: all[all.length - 1]!,
          all,
        },
      ];
    }
  }

  private addService<T>(
    lifetime: ServiceLifetime,
    service: SingleServiceType<T>,
    implementation: IServiceImplementation<T>,
  ): this {
    let resolver: IServiceImplementationResolver<T>;
    if (isServiceImplementationResolver(implementation)) {
      resolver = implementation;
    } else if (typeof implementation === "function") {
      resolver = new RegistryServiceImplementationResolver(
        implementation as SingleServiceImplementation<T>,
      );
    } else {
      resolver = new ValueServiceImplementationResolver(implementation);
    }

    const descriptor: IServiceDescriptor<T> = {
      lifetime,
      service,
      resolver,
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
