import type { IServiceCollection } from "./IServiceCollection.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import {
  ServiceLifetime,
  type IServiceDescriptor,
} from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import { IServiceProvider } from "./IServiceProvider.js";
import type { ServiceImplementation } from "./ServiceImplementation.js";
import type { ServiceType } from "./ServiceType.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";

export class ServiceCollection implements IServiceCollection {
  protected readonly collection: Map<any, IServiceDescriptor<unknown>[]>;
  constructor(collection?: ServiceCollection) {
    this.collection = new Map(collection?.copy() || []);
    if (!this.collection.has(IServiceProvider)) {
      this.addSingleton(IServiceProvider, () => {
        throw new Error("Not implemented");
      });
    }
  }

  [Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, undefined> {
    const collection = this.collection;
    return (function* iterator() {
      for (const descriptors of collection.values()) {
        for (const descriptor of descriptors) {
          yield descriptor;
        }
      }
    })();
  }

  getDescriptors(service: any): IServiceDescriptor<unknown>[] {
    return this.collection.get(service) ?? [];
  }

  addScoped<T>(service: ServiceImplementation<T>): this;
  addScoped<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
  addScoped<T>(
    service: ServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addScoped<T>(
    service: ServiceType<T>,
    implementation: ServiceType<T> | T = service,
  ): this {
    this.addService(ServiceLifetime.Scoped, service, implementation);
    return this;
  }

  addTransient<T>(service: ServiceImplementation<T>): this;
  addTransient<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
  addTransient<T>(
    service: ServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addTransient<T>(
    service: ServiceType<T>,
    implementation: ServiceType<T> | T = service,
  ): this {
    this.addService(ServiceLifetime.Transient, service, implementation);
    return this;
  }

  addSingleton<T>(service: ServiceImplementation<T>): this;
  addSingleton<T>(service: ServiceType<T>, implementation: T): this;
  addSingleton<T>(
    service: ServiceType<T>,
    constructor: IServiceConstructor<T>,
  ): this;
  addSingleton<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
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
      },
    ]);

    this.tryResolveService(service, []);

    return this;
  }

  // we will try to determine cyclic dependencies
  private tryResolveService<T>(service: ServiceType<T>, path: string[]): void {
    const descriptors = this.getDescriptors(service);

    for (const descriptor of descriptors) {
      const name = getNameOfServiceType(descriptor.service);
      const metadata = ServiceRegistry.get(descriptor.implementation);

      if (metadata) {
        if (path.includes(metadata.name!)) {
          throw new Error(
            `Cyclic dependency detected: ${path.join(" -> ")} -> ${name}`,
          );
        }

        path = [...path, name];

        if (name !== metadata.name) {
          path = [...path, metadata.name!];
        }

        for (const dependency of metadata.dependencies) {
          const service = Array.isArray(dependency)
            ? dependency[0]!
            : dependency;

          this.tryResolveService(service, path);
        }
      }
    }
  }
}
