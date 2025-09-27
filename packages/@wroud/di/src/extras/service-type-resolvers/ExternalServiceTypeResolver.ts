import type {
  ServiceType,
  IServiceDescriptor,
  IServiceDescriptorResolver,
  IServiceCollection,
  IServiceInstancesStore,
  IResolverServiceType,
  RequestPath,
  SingleServiceType,
} from "../../types/index.js";
import {
  BaseServiceTypeResolver,
  isServiceTypeResolver,
} from "../../service-type-resolvers/BaseServiceTypeResolver.js";

export const CONTEXT_EXTERNAL_SERVICES_KEY = Symbol("provided");

export class ExternalServiceTypeResolver<T> extends BaseServiceTypeResolver<
  T,
  T
> {
  private readonly externals: Map<SingleServiceType<unknown>, unknown>;
  constructor(next: ServiceType<T>) {
    super(next);
    this.externals = new Map();
  }

  set<TService>(
    service: SingleServiceType<TService, any[]>,
    implementation: TService,
  ): this {
    this.externals.set(service, implementation);
    return this;
  }

  override resolve(
    collection: IServiceCollection,
    instancesStore: IServiceInstancesStore,
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
    descriptor?: IServiceDescriptor<T>,
  ): Generator<Promise<unknown>, T, unknown> {
    if (isServiceTypeResolver(this.next)) {
      return this.next.resolve(
        collection,
        instancesStore,
        resolveServiceImplementation,
        requestedBy,
        requestedPath,
        mode,
        { ...context, [CONTEXT_EXTERNAL_SERVICES_KEY]: this.externals },
        descriptor,
      );
    }

    return resolveServiceImplementation(
      descriptor ?? collection.getDescriptor(this.next),
      requestedBy,
      requestedPath,
      mode,
      { ...context, [CONTEXT_EXTERNAL_SERVICES_KEY]: this.externals },
    );
  }
}

export function isExternalServiceTypeResolver<T>(
  value: IResolverServiceType<T, any>,
): value is IResolverServiceType<T, T> {
  return value instanceof ExternalServiceTypeResolver;
}
