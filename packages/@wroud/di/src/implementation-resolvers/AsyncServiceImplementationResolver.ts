import { AsyncServiceImplementationError } from "../di/errors/AsyncServiceImplementationError.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
} from "../types/index.js";
import { Debug } from "../debug.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";
import { RegistryServiceImplementationResolver } from "./RegistryServiceImplementationResolver.js";
import { ValueServiceImplementationResolver } from "./ValueServiceImplementationResolver.js";

const NOT_LOADED = Symbol("NOT_LOADED");

export class AsyncServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    if (this.implementation === NOT_LOADED) {
      //"lazy(?)"
      return Debug.errors.serviceNotLoaded(this.loader);
    }
    return getNameOfServiceType(this.implementation);
  }

  private implementation: IServiceImplementationResolver<T> | typeof NOT_LOADED;
  private promise: Promise<IServiceImplementationResolver<T>> | null;

  constructor(
    private loader: () => Promise<T | IServiceImplementationResolver<T>>,
  ) {
    super();
    this.implementation = NOT_LOADED;
    this.promise = null;
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    if (mode === "sync" && descriptor.dry) {
      return yield* new ValueServiceImplementationResolver(null as T).resolve(
        internalGetService,
        descriptor,
        requestedBy,
        mode,
      );
    }

    if (this.implementation === NOT_LOADED || mode === "sync") {
      yield this.load();

      if (this.implementation === NOT_LOADED) {
        throw new AsyncServiceImplementationError();
      }
    }

    return yield* this.implementation.resolve(
      internalGetService,
      descriptor,
      requestedBy,
      mode,
    );
  }

  private async load(): Promise<IServiceImplementationResolver<T>> {
    if (this.implementation !== NOT_LOADED) {
      return this.implementation;
    }
    if (!this.promise) {
      this.promise = this.loader()
        .then((implementation) => {
          this.implementation = new RegistryServiceImplementationResolver(
            implementation,
          );
          return this.implementation;
        })
        .finally(() => {
          this.promise = null;
        });
    }
    return this.promise;
  }
}
