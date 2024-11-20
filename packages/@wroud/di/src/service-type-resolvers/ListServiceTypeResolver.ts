import type {
  ServiceType,
  IServiceDescriptorResolver,
  IServiceDescriptor,
  IServiceCollection,
  IServiceInstancesStore,
} from "../types/index.js";
import {
  BaseServiceTypeResolver,
  isServiceTypeResolver,
} from "./BaseServiceTypeResolver.js";

export class ListServiceTypeResolver<T> extends BaseServiceTypeResolver<
  T,
  T[]
> {
  constructor(next: ServiceType<T>) {
    super(next);
  }

  override *resolve(
    collection: IServiceCollection,
    instancesStore: IServiceInstancesStore,
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T[], unknown> {
    const descriptors = collection.getDescriptors(this.service);

    const services: T[] = [];

    let next = this.next;
    for (const descriptor of descriptors) {
      if (isServiceTypeResolver(next)) {
        services.push(
          yield* next.resolve(
            collection,
            instancesStore,
            resolveServiceImplementation,
            requestedBy,
            mode,
            descriptor,
          ),
        );
      } else {
        services.push(
          yield* resolveServiceImplementation(descriptor, requestedBy, mode),
        );
      }
    }

    return services;
  }
}
