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
  IResolvedServiceImplementation,
} from "../types/index.js";
import { resolveGeneratorAsync } from "../helpers/resolveGeneratorAsync.js";
import { resolveGeneratorSync } from "../helpers/resolveGeneratorSync.js";
import { isServiceProvider } from "../helpers/isServiceProvider.js";
import { all } from "../service-type-resolvers/all.js";
import { isServiceTypeResolver } from "../service-type-resolvers/BaseServiceTypeResolver.js";
import { Debug } from "../debug.js";
import { EMPTY_DEPS } from "../helpers/EMPTY_DEPS.js";

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

  private readonly descriptorResolverStore: Map<
    IServiceDescriptor<unknown>,
    IResolvedServiceImplementation<unknown>
  >;
  private readonly instancesStore: IServiceInstancesStore;
  private readonly root: ServiceProvider;
  constructor(
    private readonly collection: ServiceCollection,
    private readonly parent?: IServiceProvider,
  ) {
    this.instancesStore = new ServiceInstancesStore();
    if (parent) {
      this.root = (parent as ServiceProvider).root;
      this.descriptorResolverStore = (
        parent as ServiceProvider
      ).descriptorResolverStore;
    } else {
      this.descriptorResolverStore = new Map<
        IServiceDescriptor<unknown>,
        IResolvedServiceImplementation<unknown>
      >();
      this.root = this;
    }
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
    return resolveGeneratorAsync(
      this.internalGetService(service, null, EMPTY_PATH, "async"),
    );
  }

  getService<T>(service: ServiceType<T>): T {
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
    service: ServiceType<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown> {
    if (!isServiceTypeResolver(service)) {
      return this.resolveServiceImplementation(
        this.collection.getDescriptor(service),
        requestedBy,
        requestedPath,
        mode,
      );
    }
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
    if (
      this.parent !== undefined &&
      descriptor.lifetime === ServiceLifetime.Singleton
    ) {
      return this.root.resolveServiceImplementation(
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

        let resolved = this.descriptorResolverStore.get(
          descriptor,
        ) as IResolvedServiceImplementation<T>;

        if (!resolved) {
          resolved = yield* descriptor.resolver.resolve(
            this.internalGetService,
            descriptor,
            requestedBy,
            requestedPath,
            mode,
          );
          this.descriptorResolverStore.set(descriptor, resolved);
        }

        const dependencies =
          resolved.dependencies.length > 0
            ? yield* this.initDependencies(
                descriptor,
                requestedPath,
                mode,
                resolved.dependencies,
              )
            : EMPTY_DEPS;
        return resolved.create(dependencies);
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

      let resolved = this.descriptorResolverStore.get(
        descriptor,
      ) as IResolvedServiceImplementation<T>;

      if (!resolved) {
        resolved = yield* descriptor.resolver.resolve(
          this.internalGetService,
          descriptor,
          requestedBy,
          requestedPath,
          mode,
        );
        this.descriptorResolverStore.set(descriptor, resolved);
      }

      const instance = this.instancesStore.addInstance(descriptor, requestedBy);

      const dependencies =
        resolved.dependencies.length > 0
          ? yield* this.initDependencies(
              descriptor,
              requestedPath,
              mode,
              resolved.dependencies,
            )
          : EMPTY_DEPS;

      return instance.initialize(resolved.create, dependencies);
    } catch (exception: any) {
      throw new Error(
        `Failed to initiate service ${getNameOfDescriptor(descriptor)}:\n\r${exception.message}`,
        { cause: exception },
      );
    }
  }

  private *initDependencies<T>(
    descriptor: IServiceDescriptor<T>,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    dependencies: readonly ServiceType<any>[],
  ): Generator<Promise<unknown>, any[], unknown> {
    if (Debug.extended) {
      requestedPath = { value: descriptor, next: requestedPath };
    }
    const len = dependencies.length;
    if (len === 1) {
      return [
        yield* this.internalGetService(
          dependencies[0]!,
          descriptor,
          requestedPath,
          mode,
        ),
      ];
    }
    const results = new Array(len);
    for (let i = 0; i < len; i++) {
      results[i] = yield* this.internalGetService(
        dependencies[i]!,
        descriptor,
        requestedPath,
        mode,
      );
    }
    return results;
  }

  [Symbol.dispose]() {
    this.instancesStore[Symbol.dispose]();
  }

  async [Symbol.asyncDispose]() {
    await this.instancesStore[Symbol.asyncDispose]();
  }
}
