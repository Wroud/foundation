import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
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
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    let implementation = this.implementation;

    if (isServiceImplementationResolver<T>(implementation)) {
      implementation = (yield* implementation.resolve(
        internalGetService,
        descriptor,
        requestedBy,
        mode,
      )) as T;
    }

    return () => implementation;
  }
}
