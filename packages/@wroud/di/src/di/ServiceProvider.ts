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
  ServiceType,
  RequestPath,
  IRequestPathNode,
} from "../types/index.js";
import { resolveGeneratorAsync } from "../helpers/resolveGeneratorAsync.js";
import { resolveGeneratorSync } from "../helpers/resolveGeneratorSync.js";
import { isServiceProvider } from "../helpers/isServiceProvider.js";
import { all } from "../service-type-resolvers/all.js";
import { single } from "../service-type-resolvers/single.js";
import { isServiceTypeResolver } from "../service-type-resolvers/BaseServiceTypeResolver.js";
import { Debug } from "../debug.js";

const EMPTY_PATH: IRequestPathNode<IServiceDescriptor<any> | null> = {
  value: null,
  next: null,
};

export class ServiceProvider implements IServiceProvider {
  static internalGetService<T>(
    provider: IServiceProvider,
    service: IResolverServiceType<any, T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    if (!(provider instanceof ServiceProvider)) {
      throw new Error("provider must be an instance of ServiceProvider");
    }
    return provider.internalGetService(
      service,
      requestedBy,
      requestedPath,
      mode,
    );
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
  ): readonly IServiceDescriptor<T>[] {
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

  getServices<T>(service: ServiceType<T>): T[] {
    return resolveGeneratorSync(
      this.internalGetService(all(service), null, EMPTY_PATH, "sync"),
    );
  }

  getServiceAsync<T>(service: ServiceType<T>): Promise<T> {
    if (!isServiceTypeResolver(service)) {
      service = single(service);
    }

    return resolveGeneratorAsync(
      this.internalGetService(service, null, EMPTY_PATH, "async"),
    );
  }

  getService<T>(service: ServiceType<T>): T {
    if (!isServiceTypeResolver(service)) {
      service = single(service);
    }

    return resolveGeneratorSync(
      this.internalGetService(service, null, EMPTY_PATH, "sync"),
    );
  }

  getServicesAsync<T>(service: ServiceType<T>): Promise<T[]> {
    return resolveGeneratorAsync(
      this.internalGetService(all(service), null, EMPTY_PATH, "async"),
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
    service: IResolverServiceType<any, T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    return service.resolve(
      this.collection,
      this.instancesStore,
      this.resolveServiceImplementation,
      requestedBy,
      requestedPath,
      mode,
    );
  }

  private resolveServiceImplementation<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    if (descriptor.lifetime === ServiceLifetime.Singleton && this.parent) {
      return (this.parent as ServiceProvider).resolveServiceImplementation(
        descriptor,
        requestedBy,
        requestedPath,
        mode,
      );
    }

    if (descriptor.lifetime !== ServiceLifetime.Transient) {
      const instanceInfo = this.instancesStore.getInstanceInfo(descriptor);

      if (instanceInfo?.initialized) {
        return instanceInfo.getInstance() as Generator<any, T, any>;
      }
    }

    if (Debug.extended) {
      validateRequestPath(requestedPath, descriptor);
    }

    return this.createInstanceFromDescriptor(
      descriptor,
      requestedBy,
      requestedPath,
      mode,
    );
  }

  private *createInstanceFromDescriptor<T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    try {
      if (descriptor.lifetime === ServiceLifetime.Transient) {
        if (isServiceProvider(descriptor.service)) {
          return this as unknown as T;
        }

        return (yield* descriptor.resolver.resolve(
          this.internalGetService,
          descriptor,
          requestedBy,
          requestedPath,
          mode,
        ))();
      }

      if (descriptor.lifetime === ServiceLifetime.Scoped) {
        if (requestedBy?.lifetime === ServiceLifetime.Singleton) {
          throw new Error(
            `Scoped service cannot be resolved from singleton service.`,
          );
        }
        if (!this.parent) {
          throw new Error("Scoped services require a service scope.");
        }
      }

      return this.instancesStore
        .addInstance(descriptor, requestedBy)
        .initialize(
          yield* descriptor.resolver.resolve(
            this.internalGetService,
            descriptor,
            requestedBy,
            requestedPath,
            mode,
          ),
        );
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
