import { EMPTY_DEPS } from "../helpers/EMPTY_DEPS.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ValueServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  constructor(private readonly implementation: T) {
    super({
      dependencies: EMPTY_DEPS,
      create: () => implementation,
    });
  }
}
