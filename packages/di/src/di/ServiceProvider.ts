import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import { ServiceInstancesStore } from "./ServiceInstancesStore.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { isAsyncServiceImplementationLoader } from "../helpers/isAsyncServiceImplementationLoader.js";
import { validateRequestPath } from "./validation/validateRequestPath.js";
import { getNameOfDescriptor } from "../helpers/getNameOfDescriptor.js";
import { Debug } from "../debug.js";
import type {
  IAsyncServiceScope,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceFactory,
  IServiceInstancesStore,
  IServiceScope,
  ServiceType,
  SingleServiceType,
} from "../types/index.js";

export class ServiceProvider implements IServiceProvider {
  static internalGetService<T>(
    provider: IServiceProvider,
    service: SingleServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T, unknown>;
  static internalGetService<T>(
    provider: IServiceProvider,
    service: SingleServiceType<T>[],
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T[], unknown>;
  static internalGetService<T>(
    provider: IServiceProvider,
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T | T[], unknown>;
  static internalGetService<T>(
    provider: IServiceProvider,
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T | T[], unknown> {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.internalGetService(service, requestedBy);
  }

  static getDescriptor<T>(
    provider: IServiceProvider,
    service: SingleServiceType<T>,
  ): IServiceDescriptor<T> {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.getDescriptor(service);
  }

  static getDescriptors<T>(
    provider: IServiceProvider,
    service: SingleServiceType<T>,
  ): IServiceDescriptor<T>[] {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.collection.getDescriptors(service);
  }

  private readonly instancesStore: IServiceInstancesStore;
  constructor(
    private readonly collection: ServiceCollection,
    private readonly parent?: IServiceProvider,
  ) {
    this.instancesStore = new ServiceInstancesStore();
  }

  getServices<T>(service: SingleServiceType<T>): T[] {
    return this.resolveGeneratorSync(
      this.internalGetService([service], new Set()),
    );
  }

  getServiceAsync<T>(service: SingleServiceType<T>): Promise<T> {
    return this.resolveGeneratorAsync(
      this.internalGetService(service, new Set()),
    );
  }

  getService<T>(service: SingleServiceType<T>): T {
    return this.resolveGeneratorSync(
      this.internalGetService(service, new Set()),
    );
  }

  getServicesAsync<T>(service: SingleServiceType<T>): Promise<T[]> {
    return this.resolveGeneratorAsync(
      this.internalGetService([service], new Set()),
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

  private internalGetService<T>(
    service: SingleServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T, unknown>;
  private internalGetService<T>(
    service: SingleServiceType<T>[],
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T[], unknown>;
  private internalGetService<T>(
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T | T[], unknown>;
  private *internalGetService<T>(
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T | T[], unknown> {
    const isAllServices = Array.isArray(service);
    const descriptors = isAllServices
      ? this.collection.getDescriptors(service[0]!)
      : [this.getDescriptor(service)];

    const services: T[] = [];

    for (const descriptor of descriptors) {
      services.push(
        yield* this.internalGetDescriptorImplementation(
          descriptor,
          requestedBy,
        ),
      );
    }

    if (isAllServices) {
      return services;
    }
    return services[0] as T;
  }

  private *internalGetDescriptorImplementation<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T, unknown> {
    if (
      descriptor.lifetime === ServiceLifetime.Singleton &&
      this.parent &&
      descriptor.service !== IServiceProvider
    ) {
      return yield* (
        this.parent as ServiceProvider
      ).internalGetDescriptorImplementation(descriptor, requestedBy);
    }

    validateRequestPath(requestedBy, descriptor);

    return yield* this.createInstanceFromDescriptor(descriptor, requestedBy);
  }

  private *createInstanceFromDescriptor<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, T, unknown> {
    try {
      const lastRequestedBy = [...requestedBy].pop();
      if (lastRequestedBy?.lifetime !== undefined) {
        if (
          lastRequestedBy.lifetime === ServiceLifetime.Singleton &&
          descriptor.lifetime === ServiceLifetime.Scoped
        ) {
          throw new Error(
            `Scoped service cannot be resolved from singleton service.`,
          );
        }
      }

      switch (descriptor.lifetime) {
        // @ts-expect-error
        case ServiceLifetime.Scoped:
          if (!this.parent) {
            throw new Error("Scoped services require a service scope.");
          }
        case ServiceLifetime.Singleton: {
          const instanceInfo = this.instancesStore.addInstance(
            descriptor,
            lastRequestedBy,
          );

          instanceInfo.initialize(
            yield* this.createServiceInitializer(descriptor, requestedBy),
          );

          return instanceInfo.instance;
        }
        case ServiceLifetime.Transient:
          return (yield* this.createServiceInitializer(
            descriptor,
            requestedBy,
          ))();
      }
    } catch (exception: any) {
      throw new Error(
        `Failed to initiate service ${getNameOfDescriptor(descriptor)}:\n\r${exception.message}`,
        { cause: exception },
      );
    }
  }

  private *createServiceInitializer<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<Promise<unknown>, () => T, unknown> {
    let implementation = descriptor.implementation;

    if (isAsyncServiceImplementationLoader(implementation)) {
      if (!implementation.isLoaded()) {
        yield implementation.load();
      }
      implementation = implementation.getImplementation();
    }

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      const dependencies: any[] = [];
      requestedBy = new Set([...requestedBy, descriptor]);
      for (const dependency of metadata.dependencies) {
        dependencies.push(
          yield* this.internalGetService(dependency, requestedBy),
        );
      }

      return () =>
        new (implementation as IServiceConstructor<T>)(...dependencies);
    }

    if (descriptor.service === IServiceProvider) {
      return () => this as unknown as T;
    }

    if (typeof implementation === "function") {
      return () => {
        try {
          return (implementation as IServiceFactory<T>)(this);
        } catch (err) {
          if (
            err instanceof TypeError &&
            err.message.includes("cannot be invoked without 'new'")
          ) {
            throw new Error(
              Debug.errors.classNotDecorated(implementation.name),
              {
                cause: err,
              },
            );
          } else {
            throw err;
          }
        }
      };
    }

    return () => implementation;
  }

  private getDescriptor<T>(
    service: SingleServiceType<T>,
  ): IServiceDescriptor<T> {
    const descriptors = this.collection.getDescriptors(service);

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

  private resolveGeneratorSync<T, TResult>(
    iterator: Generator<Promise<unknown>, TResult, unknown>,
  ) {
    let result: IteratorResult<Promise<unknown>, TResult>;

    while (!(result = iterator.next()).done) {
      throw new Error(`Lazy service cannot be resolved synchronously`);
    }

    return result.value;
  }

  private async resolveGeneratorAsync<T, TResult>(
    iterator: Generator<Promise<unknown>, TResult, unknown>,
  ) {
    let result: IteratorResult<Promise<unknown>, TResult>;

    while (!(result = iterator.next()).done) {
      await result.value;
    }

    return result.value;
  }

  [Symbol.dispose]() {
    this.instancesStore[Symbol.dispose]();
  }

  async [Symbol.asyncDispose]() {
    await this.instancesStore[Symbol.asyncDispose]();
  }
}
