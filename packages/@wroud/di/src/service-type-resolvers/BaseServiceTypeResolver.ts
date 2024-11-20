import type {
  ServiceType,
  IServiceDescriptor,
  IResolverServiceType,
  SingleServiceType,
  IServiceDescriptorResolver,
  IServiceCollection,
  IServiceInstancesStore,
} from "../types/index.js";

export abstract class BaseServiceTypeResolver<In, Out>
  implements IResolverServiceType<In, Out>
{
  get name(): string {
    return this.service.name;
  }
  get service(): SingleServiceType<In> {
    if (isServiceTypeResolver(this.next)) {
      return this.next.service;
    }
    return this.next;
  }

  constructor(readonly next: ServiceType<In>) {}

  abstract resolve(
    collection: IServiceCollection,
    instancesStore: IServiceInstancesStore,
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
    descriptor?: IServiceDescriptor<In>,
  ): Generator<Promise<unknown>, Out, unknown>;
}

export function isServiceTypeResolver<In, Out>(
  value: unknown,
): value is IResolverServiceType<In, Out> {
  return value instanceof BaseServiceTypeResolver;
}
