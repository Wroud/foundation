import { resolveGeneratorAsync } from "../helpers/resolveGeneratorAsync.js";
import { resolveGeneratorSync } from "../helpers/resolveGeneratorSync.js";
import type {
  ServiceType,
  IServiceDescriptor,
  IServiceDescriptorResolver,
  IServiceCollection,
  IResolverServiceType,
} from "../types/index.js";
import {
  BaseServiceTypeResolver,
  isServiceTypeResolver,
} from "./BaseServiceTypeResolver.js";

export interface IOptionalService<T> {
  resolve(): T;
  resolveAsync(): Promise<T>;
}

export class OptionalServiceTypeResolver<T> extends BaseServiceTypeResolver<
  T,
  IOptionalService<T>
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
  ): Generator<Promise<unknown>, IOptionalService<T>, unknown> {
    let next = this.next;

    function* resolve(mode: "sync" | "async") {
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

    return {
      resolve() {
        return resolveGeneratorSync(resolve("sync"));
      },
      resolveAsync() {
        return resolveGeneratorAsync(resolve("async"));
      },
    };
  }
}

export function isOptionalServiceTypeResolver<T>(
  value: IResolverServiceType<T, any>,
): value is IResolverServiceType<T, IOptionalService<T>> {
  return value instanceof OptionalServiceTypeResolver;
}
