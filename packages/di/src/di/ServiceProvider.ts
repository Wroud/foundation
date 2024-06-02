import type { IAsyncServiceScope } from "./IAsyncServiceScope.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import {
  ServiceLifetime,
  type IServiceDescriptor,
} from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { IServiceInstanceInfo } from "./IServiceInstanceInfo.js";
import { IServiceProvider } from "./IServiceProvider.js";
import type { IServiceScope } from "./IServiceScope.js";
import { ServiceCollection } from "./ServiceCollection.js";
import type { ServiceType } from "./ServiceType.js";
import { ServiceRegistry } from "./ServicesRegistry.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";

export class ServiceProvider implements IServiceProvider {
  private readonly instances: Map<
    ServiceType<any>,
    IServiceInstanceInfo<any>[]
  >;
  constructor(
    private readonly collection: ServiceCollection,
    private readonly parent?: IServiceProvider
  ) {
    this.instances = new Map();
    this.addInstance(
      IServiceProvider,
      collection.getDescriptors(IServiceProvider)![0]!,
      this
    );
  }

  getServices<T>(service: ServiceType<T>): T[] {
    const services: T[] = [];

    for (const descriptor of this.collection.getDescriptors(service)) {
      services.push(
        this.createInstanceFromDescriptor(
          service,
          descriptor as IServiceDescriptor<T>
        )
      );
    }

    return services;
  }

  getService<T>(service: ServiceType<T>): T {
    const descriptors = this.collection.getDescriptors(service);

    if (descriptors.length === 0) {
      let name = getNameOfServiceType(service);

      const metadata = ServiceRegistry.get(service);

      if (metadata?.name) {
        name = metadata.name;
      }

      throw new Error(`No service of type "${name}" is registered`);
    }

    return this.createInstanceFromDescriptor(
      service,
      descriptors[descriptors.length - 1]! as IServiceDescriptor<T>
    );
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

  private createInstanceFromDescriptor<T>(
    service: ServiceType<T>,
    descriptor: IServiceDescriptor<T>
  ): T {
    const initialize = () => {
      try {
        const metadata = ServiceRegistry.get(descriptor.implementation);

        if (metadata) {
          const dependencies = metadata.dependencies.map((dependency) => {
            if (Array.isArray(dependency)) {
              return this.getServices(dependency[0]!);
            }
            return this.getService(dependency);
          });

          return new (descriptor.implementation as IServiceConstructor<T>)(
            ...dependencies
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
                { cause: err }
              );
            } else {
              throw err;
            }
          }
        }

        return descriptor.implementation;
      } catch (err: any) {
        throw new Error(
          `Failed to initiate service "${getNameOfServiceType(service)}":\n\r${err.message}`,
          { cause: err }
        );
      }
    };

    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        if (this.parent) {
          return this.parent.getService(service as any);
        } else if (!this.hasInstanceOf(service, descriptor)) {
          this.addInstance(service, descriptor, initialize());
        }

        return this.getInstanceInfo(service, descriptor)?.instance!;
      case ServiceLifetime.Scoped:
        if (!this.parent) {
          throw new Error("Scoped services require a service scope.");
        }
        if (!this.hasInstanceOf(service, descriptor)) {
          this.addInstance(service, descriptor, initialize());
        }
        return this.getInstanceInfo(service, descriptor)?.instance!;
      case ServiceLifetime.Transient:
        return initialize();

      default:
        throw new Error("Invalid lifetime");
    }
  }

  private hasInstanceOf<T>(
    service: ServiceType<T>,
    descriptor: IServiceDescriptor<T>
  ): boolean {
    for (const instance of this.instances.get(service) ?? []) {
      if (instance.descriptor === descriptor) {
        return true;
      }
    }

    return false;
  }

  private getInstanceInfo<T>(
    service: ServiceType<T>,
    descriptor: IServiceDescriptor<T>
  ): IServiceInstanceInfo<T> | undefined {
    const instances = this.instances.get(service) ?? [];
    return instances.find((instance) => instance.descriptor === descriptor);
  }

  private addInstance<T>(
    service: ServiceType<T>,
    descriptor: IServiceDescriptor<T>,
    instance: T
  ): void {
    const instances = this.instances.get(service) || [];
    this.instances.set(service, [...instances, { descriptor, instance }]);
  }

  [Symbol.dispose]() {
    for (const instances of this.instances.values()) {
      for (const instanceInfo of instances) {
        if (instanceInfo.instance === this) {
          continue;
        }
        if (typeof instanceInfo.instance[Symbol.dispose] === "function") {
          instanceInfo.instance[Symbol.dispose]();
        }
      }
    }
    this.instances.clear();
  }

  async [Symbol.asyncDispose]() {
    await Promise.all(
      Array.from(this.instances.values()).map((instances) =>
        Promise.all(
          instances.map((instanceInfo) => {
            if (instanceInfo.instance === this) {
              return Promise.resolve();
            }

            return typeof instanceInfo.instance[Symbol.asyncDispose] ===
              "function"
              ? instanceInfo.instance[Symbol.asyncDispose]()
              : Promise.resolve();
          })
        )
      )
    );

    this.instances.clear();
  }
}
