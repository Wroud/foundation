import type { IAsyncServiceScope } from "../interfaces/IAsyncServiceScope.js";
import type { IServiceConstructor } from "../interfaces/IServiceConstructor.js";
import type { IServiceDescriptor } from "../interfaces/IServiceDescriptor.js";
import type { IServiceFactory } from "../interfaces/IServiceFactory.js";
import { IServiceProvider } from "./IServiceProvider.js";
import type { IServiceScope } from "../interfaces/IServiceScope.js";
import { ServiceCollection } from "./ServiceCollection.js";
import type { ServiceType } from "../interfaces/ServiceType.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type { IServiceInstancesStore } from "../interfaces/IServiceInstancesStore.js";
import { ServiceInstancesStore } from "./ServiceInstancesStore.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { isAsyncServiceImplementationLoader } from "../helpers/isAsyncServiceImplementationLoader.js";
import type { IAsyncServiceImplementationLoader } from "../interfaces/IAsyncServiceImplementationLoader.js";
import type { ISyncServiceImplementation } from "../interfaces/ISyncServiceImplementation.js";
import { validateRequestPath } from "./validation/validateRequestPath.js";

export class ServiceProvider implements IServiceProvider {
  private readonly instancesStore: IServiceInstancesStore;
  constructor(
    private readonly collection: ServiceCollection,
    private readonly parent?: IServiceProvider,
  ) {
    this.instancesStore = new ServiceInstancesStore();
  }

  getServices<T>(service: ServiceType<T>): T[] {
    return this.resolveGeneratorSync(
      this.internalGetServices(service, new Set()),
    );
  }

  getServiceAsync<T>(service: ServiceType<T>): Promise<T> {
    return this.resolveGeneratorAsync(
      this.internalGetService(service, new Set()),
    );
  }

  getService<T>(service: ServiceType<T>): T {
    return this.resolveGeneratorSync(
      this.internalGetService(service, new Set()),
    );
  }

  getServicesAsync<T>(service: ServiceType<T>): Promise<T[]> {
    return this.resolveGeneratorAsync(
      this.internalGetServices(service, new Set()),
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

  private *internalGetServices<T>(
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<
    [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
    T[],
    ISyncServiceImplementation<T>
  > {
    const services: T[] = [];

    for (const descriptor of this.collection.getDescriptors(service)) {
      services.push(
        yield* this.internalGetDescriptorImplementation(
          descriptor,
          requestedBy,
        ),
      );
    }

    return services;
  }

  private *internalGetService<T>(
    service: ServiceType<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<
    [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
    T,
    ISyncServiceImplementation<T>
  > {
    const descriptor = this.getDescriptor(service);

    return yield* this.internalGetDescriptorImplementation(
      descriptor,
      requestedBy,
    );
  }

  private *internalGetDescriptorImplementation<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<
    [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
    T,
    ISyncServiceImplementation<T>
  > {
    if (
      descriptor.lifetime === ServiceLifetime.Singleton &&
      this.parent &&
      descriptor.service !== IServiceProvider
    ) {
      return yield* (this.parent as ServiceProvider).internalGetService(
        descriptor.service as any,
        requestedBy,
      );
    }

    validateRequestPath(requestedBy, descriptor);

    if (descriptor.loader) {
      return (yield [descriptor, null]) as T;
    }

    const serviceInstance = this.instancesStore.getInstanceInfo(descriptor);
    if (serviceInstance) {
      return serviceInstance.instance;
    }

    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    descriptor.loader = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    descriptor.loader.catch(() => {});

    let instance: T;
    try {
      instance = yield* this.createInstanceFromDescriptor(
        descriptor,
        requestedBy,
      );
    } catch (err: any) {
      reject!(err);
      throw err;
    } finally {
      descriptor.loader = null;
    }

    try {
      return instance;
    } finally {
      resolve!(instance);
    }
  }

  private *createInstanceFromDescriptor<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<
    [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
    T,
    ISyncServiceImplementation<T>
  > {
    try {
      const lastRequestedBy = [...requestedBy].pop();
      if (lastRequestedBy?.lifetime !== undefined) {
        if (
          lastRequestedBy.lifetime === ServiceLifetime.Singleton &&
          descriptor.lifetime === ServiceLifetime.Scoped
        ) {
          throw new Error(
            `Scoped service "${getNameOfServiceType(descriptor.service)}" cannot be resolved from singleton service.`,
          );
        }
      }

      switch (descriptor.lifetime) {
        case ServiceLifetime.Singleton: {
          const instanceInfo = this.instancesStore.addInstance(
            descriptor,
            lastRequestedBy,
          );

          instanceInfo.addInstance(
            yield* this.initializeService(descriptor, requestedBy),
          );

          return instanceInfo.instance;
        }
        case ServiceLifetime.Scoped: {
          if (!this.parent) {
            throw new Error("Scoped services require a service scope.");
          }

          const instanceInfo = this.instancesStore.addInstance(
            descriptor,
            lastRequestedBy,
          );

          instanceInfo.addInstance(
            yield* this.initializeService(descriptor, requestedBy),
          );

          return instanceInfo.instance;
        }
        case ServiceLifetime.Transient:
          return yield* this.initializeService(descriptor, requestedBy);
      }
    } catch (exception: any) {
      throw new Error(
        `Failed to initiate service "${getNameOfServiceType(descriptor.service)}":\n\r${exception.message}`,
        { cause: exception },
      );
    }
  }

  private *initializeService<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
  ): Generator<
    [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
    T,
    ISyncServiceImplementation<T>
  > {
    let implementation = descriptor.implementation;

    if (isAsyncServiceImplementationLoader(implementation)) {
      implementation = yield [descriptor, implementation];
    }

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      const dependencies = [];
      requestedBy = new Set([...requestedBy, descriptor]);
      for (const dependency of metadata.dependencies) {
        if (Array.isArray(dependency)) {
          dependencies.push(
            yield* this.internalGetServices(dependency[0]!, requestedBy),
          );
        } else {
          dependencies.push(
            yield* this.internalGetService(dependency, requestedBy),
          );
        }
      }

      return new (implementation as IServiceConstructor<T>)(...dependencies);
    }

    if (descriptor.service === IServiceProvider) {
      return this as unknown as T;
    }

    if (typeof implementation === "function") {
      try {
        return (implementation as IServiceFactory<T>)(this);
      } catch (err) {
        if (
          err instanceof TypeError &&
          err.message.includes("cannot be invoked without 'new'")
        ) {
          throw new Error(
            `Class "${implementation.name}" not registered as service (please use @injectable or ServiceRegistry)`,
            { cause: err },
          );
        } else {
          throw err;
        }
      }
    }

    return implementation;
  }

  private getDescriptor<T>(service: ServiceType<T>): IServiceDescriptor<T> {
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
    iterator: Generator<
      [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
      TResult,
      ISyncServiceImplementation<T>
    >,
  ) {
    let tempService: [any] | [] = [];
    let error: Error | null = null;
    while (true) {
      let result = null;

      if (error) {
        result = iterator.throw(error);
        error = null;
      } else {
        result = iterator.next(...tempService);
      }

      const { value, done } = result;
      if (done) {
        return value;
      }

      const [descriptor, loader] = value;

      if (!loader?.isLoaded()) {
        error = new Error(
          `Asynchronous service loader for "${getNameOfServiceType(descriptor.service)}" cannot be resolved synchronously`,
        );
        continue;
      }
      tempService = [loader.getImplementation()];
    }
  }

  private async resolveGeneratorAsync<T, TResult>(
    iterator: Generator<
      [IServiceDescriptor<T>, IAsyncServiceImplementationLoader<T> | null],
      TResult,
      ISyncServiceImplementation<T>
    >,
  ) {
    let tempService: [any] | [] = [];
    let error: Error | null = null;
    while (true) {
      let result = null;

      if (error) {
        result = iterator.throw(error);
        error = null;
      } else {
        result = iterator.next(...tempService);
      }

      try {
        const { value, done } = result;
        if (done) {
          return value;
        }

        const [descriptor, loader] = value;

        if (loader) {
          tempService = [await loader.load()];
        } else {
          tempService = [await descriptor.loader];
        }
      } catch (err: any) {
        error = err;
      }
    }
  }

  [Symbol.dispose]() {
    this.instancesStore[Symbol.dispose]();
  }

  async [Symbol.asyncDispose]() {
    await this.instancesStore[Symbol.asyncDispose]();
  }
}
