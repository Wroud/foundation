import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceInstancesStore } from "./ServiceInstancesStore.js";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { validateRequestPath } from "./validation/validateRequestPath.js";
import { getNameOfDescriptor } from "../helpers/getNameOfDescriptor.js";
import type {
  IAsyncServiceScope,
  IServiceDescriptor,
  IServiceInstancesStore,
  IServiceScope,
  IResolverServiceType,
  SingleServiceType,
} from "../types/index.js";
import { resolveGeneratorAsync } from "../helpers/resolveGeneratorAsync.js";
import { resolveGeneratorSync } from "../helpers/resolveGeneratorSync.js";
import { isServiceProvider } from "../helpers/isServiceProvider.js";
import { all } from "../service-type-resolvers/all.js";
import { single } from "../service-type-resolvers/single.js";

export class ServiceProvider implements IServiceProvider {
  static internalGetService<T>(
    provider: IServiceProvider,
    service: IResolverServiceType<any, T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.internalGetService(service, requestedBy, mode);
  }

  static getDescriptor<T>(
    provider: IServiceProvider,
    service: SingleServiceType<T>,
  ): IServiceDescriptor<T> {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.collection.getDescriptor(service);
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
    this.internalGetService = this.internalGetService.bind(this);
    this.resolveServiceImplementation =
      this.resolveServiceImplementation.bind(this);
  }

  getServices<T>(service: SingleServiceType<T>): T[] {
    return resolveGeneratorSync(
      this.internalGetService(all(service), new Set(), "sync"),
    );
  }

  getServiceAsync<T>(service: SingleServiceType<T>): Promise<T> {
    return resolveGeneratorAsync(
      this.internalGetService(single(service), new Set(), "async"),
    );
  }

  getService<T>(service: SingleServiceType<T>): T {
    return resolveGeneratorSync(
      this.internalGetService(single(service), new Set(), "sync"),
    );
  }

  getServicesAsync<T>(service: SingleServiceType<T>): Promise<T[]> {
    return resolveGeneratorAsync(
      this.internalGetService(all(service), new Set(), "async"),
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

  private *internalGetService<T>(
    service: IResolverServiceType<any, T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    return yield* service.resolve(
      this.collection,
      this.resolveServiceImplementation,
      requestedBy,
      mode,
    );
  }

  private *resolveServiceImplementation<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    validateRequestPath(requestedBy, descriptor);

    if (descriptor.lifetime === ServiceLifetime.Singleton && this.parent) {
      return yield* (
        this.parent as ServiceProvider
      ).resolveServiceImplementation(descriptor, requestedBy, mode);
    }

    return yield* this.createInstanceFromDescriptor(
      descriptor,
      requestedBy,
      mode,
    );
  }

  private *createInstanceFromDescriptor<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    try {
      const lastRequestedBy = [...requestedBy].pop();

      if (descriptor.lifetime === ServiceLifetime.Scoped) {
        if (lastRequestedBy?.lifetime === ServiceLifetime.Singleton) {
          throw new Error(
            `Scoped service cannot be resolved from singleton service.`,
          );
        }

        if (!this.parent) {
          throw new Error("Scoped services require a service scope.");
        }
      }

      switch (descriptor.lifetime) {
        case ServiceLifetime.Scoped:
        case ServiceLifetime.Singleton: {
          const instanceInfo = this.instancesStore.addInstance(
            descriptor,
            lastRequestedBy,
          );

          instanceInfo.initialize(
            yield* descriptor.resolver.resolve(
              this.internalGetService,
              descriptor,
              requestedBy,
              mode,
            ),
          );

          return instanceInfo.instance;
        }
        case ServiceLifetime.Transient: {
          if (isServiceProvider(descriptor.service)) {
            return this as unknown as T;
          }

          const implementationGetter = yield* descriptor.resolver.resolve(
            this.internalGetService,
            descriptor,
            requestedBy,
            mode,
          );
          return descriptor.dry ? (null as T) : implementationGetter();
        }
      }
    } catch (exception: any) {
      throw new Error(
        `Failed to initiate service ${getNameOfDescriptor(descriptor)}:\n\r${exception.message}`,
        { cause: exception },
      );
    }
  }

  [Symbol.dispose]() {
    this.instancesStore[Symbol.dispose]();
  }

  async [Symbol.asyncDispose]() {
    await this.instancesStore[Symbol.asyncDispose]();
  }
}
