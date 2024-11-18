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
import { isServiceImplementationResolver } from "../implementation-resolvers/BaseServiceImplementationResolver.js";
import { RegistryServiceImplementationResolver } from "../implementation-resolvers/RegistryServiceImplementationResolver.js";
import { ValueServiceImplementationResolver } from "../implementation-resolvers/ValueServiceImplementationResolver.js";

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceDescriptor<unknown>[]>;
  constructor(collection?: ServiceCollection) {
    this.collection = new Map(collection?.copy() || []);
    if (!this.collection.has(IServiceProvider)) {
      this.addTransient(IServiceProvider);
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

  getDescriptor<T>(service: SingleServiceType<T>): IServiceDescriptor<T> {
    const descriptors = this.getDescriptors(service);

    if (descriptors.length === 0) {
      let name = getNameOfServiceType(service);

      const metadata = ServiceRegistry.get(service);

      if (metadata?.name) {
        name = metadata.name;
      }

      throw new Error(`No service of type "${name}" is registered`);
    }

    return descriptors[descriptors.length - 1]!;
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

  protected *copy(): Iterable<[any, IServiceDescriptor<unknown>[]]> {
    for (const [key, descriptors] of this.collection) {
      yield [key, [...descriptors.map((d) => ({ ...d }))]];
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

    const descriptors = this.collection.get(service) ?? [];
    this.collection.set(service, [
      ...descriptors,
      {
        service,
        lifetime,
        resolver,
      },
    ]);

    return this;
  }
}
