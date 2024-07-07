import type { IAsyncServiceScope } from "./IAsyncServiceScope.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import {
  ServiceLifetime,
  type IServiceDescriptor,
} from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import { IServiceProvider } from "./IServiceProvider.js";
import type { IServiceScope } from "./IServiceScope.js";
import { ServiceCollection } from "./ServiceCollection.js";
import type { ServiceType } from "./ServiceType.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
import type { IServiceInstancesStore } from "./IServiceInstancesStore.js";
import { ServiceInstancesStore } from "./ServiceInstancesStore.js";

export class ServiceProvider implements IServiceProvider {
  private readonly instancesStore: IServiceInstancesStore;
  private currentResolvingLifetime: ServiceLifetime | null;
  constructor(
    private readonly collection: ServiceCollection,
    private readonly parent?: IServiceProvider,
  ) {
    this.instancesStore = new ServiceInstancesStore();
    this.instancesStore.addInstance(
      collection.getDescriptors(IServiceProvider)![0]!,
      this,
    );
    this.currentResolvingLifetime = null;
  }

  getServices<T>(service: ServiceType<T>): T[] {
    const services: T[] = [];

    for (const descriptor of this.collection.getDescriptors(service)) {
      services.push(
        this.createInstanceFromDescriptor(
          service,
          descriptor as IServiceDescriptor<T>,
        ),
      );
    }

    return services;
  }

  getService<T>(service: ServiceType<T>): T {
    return this.internalGetService(service);
  }

  createScope(): IServiceScope {
    const serviceProvider = new ServiceProvider(this.collection, this);

    return {
      serviceProvider,
      [Symbol.dispose]: () => {
        serviceProvider[Symbol.dispose]();
      },
    };
  }

  createAsyncScope(): IAsyncServiceScope {
    const serviceProvider = new ServiceProvider(this.collection, this);

    return {
      serviceProvider,
      [Symbol.asyncDispose]: async () => {
        await serviceProvider[Symbol.asyncDispose]();
      },
    };
  }

  private internalGetService<T>(service: ServiceType<T>, requestedBy?: any): T {
    const descriptors = this.collection.getDescriptors(service);

    if (descriptors.length === 0) {
      let name = getNameOfServiceType(service);

      const metadata = ServiceRegistry.get(service);

      if (metadata?.name) {
        name = metadata.name;
      }

      throw new Error(`No service of type "${name}" is registered`);
    }
    const descriptor = descriptors[descriptors.length - 1]!;
    let serviceInstance = this.instancesStore.getInstanceInfo(descriptor);

    return (
      serviceInstance?.instance ||
      this.createInstanceFromDescriptor(service, descriptor)
    );
  }

  private createInstanceFromDescriptor<T>(
    service: ServiceType<T>,
    descriptor: IServiceDescriptor<T>,
  ): T {
    const inheritedLifetime = this.currentResolvingLifetime;
    try {
      if (this.currentResolvingLifetime !== null) {
        if (
          this.currentResolvingLifetime === ServiceLifetime.Singleton &&
          descriptor.lifetime === ServiceLifetime.Scoped
        ) {
          throw new Error(
            `Scoped service "${getNameOfServiceType(service)}" cannot be resolved from singleton service.`,
          );
        }
      }
      this.currentResolvingLifetime = descriptor.lifetime;

      const initialize = () => {
        const metadata = ServiceRegistry.get(descriptor.implementation);

        if (metadata) {
          const dependencies = metadata.dependencies.map((dependency) => {
            if (Array.isArray(dependency)) {
              return this.getServices(dependency[0]!);
            }
            return this.getService(dependency);
          });

          return new (descriptor.implementation as IServiceConstructor<T>)(
            ...dependencies,
          );
        }

        if (typeof descriptor.implementation === "function") {
          try {
            return (descriptor.implementation as IServiceFactory<T>)(this);
          } catch (err) {
            if (
              err instanceof TypeError &&
              err.message.includes("cannot be invoked without 'new'")
            ) {
              throw new Error(
                `Class "${descriptor.implementation.name}" not registered as service (please use @injectable or ServiceRegistry)`,
                { cause: err },
              );
            } else {
              throw err;
            }
          }
        }

        return descriptor.implementation;
      };

      switch (descriptor.lifetime) {
        case ServiceLifetime.Singleton:
          if (this.parent) {
            return this.parent.getService(service as any);
          } else if (!this.instancesStore.hasInstanceOf(descriptor)) {
            this.instancesStore.addInstance(descriptor, initialize());
          }

          return this.instancesStore.getInstanceInfo(descriptor)?.instance!;
        case ServiceLifetime.Scoped:
          if (!this.parent) {
            throw new Error("Scoped services require a service scope.");
          }
          if (!this.instancesStore.hasInstanceOf(descriptor)) {
            this.instancesStore.addInstance(descriptor, initialize());
          }
          return this.instancesStore.getInstanceInfo(descriptor)?.instance!;
        case ServiceLifetime.Transient:
          return initialize();

        default:
          throw new Error("Invalid lifetime");
      }
    } catch (exception: any) {
      throw new Error(
        `Failed to initiate service "${getNameOfServiceType(service)}":\n\r${exception.message}`,
        { cause: exception },
      );
    } finally {
      this.currentResolvingLifetime = inheritedLifetime;
    }
  }

  [Symbol.dispose]() {
    this.instancesStore[Symbol.dispose]();
  }

  async [Symbol.asyncDispose]() {
    await this.instancesStore[Symbol.asyncDispose]();
  }
}
