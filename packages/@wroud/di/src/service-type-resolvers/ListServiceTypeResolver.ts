import type {
  ServiceType,
  IServiceDescriptorResolver,
  IServiceDescriptor,
  IServiceCollection,
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
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
    descriptor?: IServiceDescriptor<T>,
  ): Generator<Promise<unknown>, T[], unknown> {
    const descriptors = collection.getDescriptors(this.service);

    const services: T[] = [];

    let next = this.next;
    for (const descriptor of descriptors) {
      if (isServiceTypeResolver(next)) {
        services.push(
          yield* next.resolve(
            collection,
            resolveServiceImplementation,
            requestedBy,
            mode,
            descriptor,
          ),
        );
      }
      services.push(
        yield* resolveServiceImplementation(descriptor, requestedBy, mode),
      );
    }

    return services;
  }
}
