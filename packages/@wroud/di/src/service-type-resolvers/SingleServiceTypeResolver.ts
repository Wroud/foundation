import type {
  ServiceType,
  IServiceDescriptor,
  IServiceDescriptorResolver,
  IServiceCollection,
  IServiceInstancesStore,
  RequestPath,
} from "../types/index.js";
import {
  BaseServiceTypeResolver,
  isServiceTypeResolver,
} from "./BaseServiceTypeResolver.js";

export class SingleServiceTypeResolver<T> extends BaseServiceTypeResolver<
  T,
  T
> {
  constructor(next: ServiceType<T>) {
    super(next);
  }

  override resolve(
    collection: IServiceCollection,
    instancesStore: IServiceInstancesStore,
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
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
        descriptor,
      );
    }

    return resolveServiceImplementation(
      descriptor ?? collection.getDescriptor(this.next),
      requestedBy,
      requestedPath,
      mode,
    );
  }
}
