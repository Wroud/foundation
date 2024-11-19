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

    if (isServiceTypeResolver(next)) {
      return new OptionalResolver<T>(function* resolver(mode) {
        return yield* next.resolve(
          collection,
          resolveServiceImplementation,
          requestedBy,
          mode,
          descriptor,
        );
      });
    }

    return new OptionalResolver<T>(function* resolver(mode) {
      return yield* resolveServiceImplementation(
        descriptor ?? collection.getDescriptor(next),
        requestedBy,
        mode,
      );
    });
  }
}

const NOT_SET = Symbol();
class OptionalResolver<T> {
  private value: T | symbol;
  private loader: Promise<T> | null;
  constructor(
    private readonly resolveInternal: (
      mode: "sync" | "async",
    ) => Generator<Promise<unknown>, T, unknown>,
  ) {
    this.value = NOT_SET;
    this.loader = null;
  }

  resolve(): T {
    if (this.value === NOT_SET) {
      this.value = resolveGeneratorSync(this.resolveInternal("sync"));
    }
    return this.value as T;
  }

  async resolveAsync(): Promise<T> {
    if (this.value === NOT_SET) {
      if (!this.loader) {
        this.loader = resolveGeneratorAsync(this.resolveInternal("async"))
          .then((value) => {
            this.value = value;
            return value;
          })
          .finally(() => {
            this.loader = null;
          });
      }
      this.value = await this.loader;
    }
    return this.value as T;
  }
}

export function isOptionalServiceTypeResolver<T>(
  value: IResolverServiceType<T, any>,
): value is IResolverServiceType<T, IOptionalService<T>> {
  return value instanceof OptionalServiceTypeResolver;
}
