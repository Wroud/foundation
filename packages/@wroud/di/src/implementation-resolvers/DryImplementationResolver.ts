import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
  RequestPath,
  SingleServiceImplementation,
} from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class DryImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  constructor(
    private readonly implementation: IServiceImplementationResolver<
      T | SingleServiceImplementation<T>
    >,
  ) {
    super();
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    yield* this.implementation.resolve(
      internalGetService,
      descriptor,
      requestedBy,
      requestedPath,
      mode,
    );

    return () => null as T;
  }
}
