import { EMPTY_DEPS } from "../helpers/EMPTY_DEPS.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type { IResolvedServiceImplementation } from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ValueServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  private readonly resolved: IResolvedServiceImplementation<T>;
  constructor(private readonly implementation: T) {
    super();
    this.resolved = {
      dependencies: EMPTY_DEPS,
      create: () => implementation,
    };
  }

  *resolve(): Generator<
    Promise<unknown>,
    IResolvedServiceImplementation<T>,
    unknown
  > {
    return this.resolved;
  }
}
