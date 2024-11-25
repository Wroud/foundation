import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
  RequestPath,
} from "../types/index.js";
import {
  BaseServiceImplementationResolver,
  isServiceImplementationResolver,
} from "./BaseServiceImplementationResolver.js";

export class ValueServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  constructor(
    private readonly implementation: T | IServiceImplementationResolver<T>,
  ) {
    super();
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    let implementation = this.implementation;

    if (isServiceImplementationResolver<T>(implementation)) {
      implementation = (yield* implementation.resolve(
        internalGetService,
        descriptor,
        requestedBy,
        requestedPath,
        mode,
      )) as T;
    }

    return () => implementation;
  }
}
