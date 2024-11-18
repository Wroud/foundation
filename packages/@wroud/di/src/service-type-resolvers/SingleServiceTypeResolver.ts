import type {
  ServiceType,
  IServiceDescriptor,
  IServiceDescriptorResolver,
  IServiceCollection,
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

  override *resolve(
    collection: IServiceCollection,
    resolveServiceImplementation: IServiceDescriptorResolver,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
    descriptor?: IServiceDescriptor<T>,
  ): Generator<Promise<unknown>, T, unknown> {
    let next = this.next;

    if (isServiceTypeResolver(next)) {
      return yield* next.resolve(
        collection,
        resolveServiceImplementation,
        requestedBy,
        mode,
        descriptor,
      );
    }

    return yield* resolveServiceImplementation(
      descriptor ?? collection.getDescriptor(next),
      requestedBy,
      mode,
    );
  }
}
