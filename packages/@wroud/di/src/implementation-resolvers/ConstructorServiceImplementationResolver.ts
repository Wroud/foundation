import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IServiceConstructor,
  ServiceType,
  GetServiceTypeImplementation,
} from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ConstructorServiceImplementationResolver<
  T,
  TArgs extends ServiceType<unknown>[],
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  constructor(
    private readonly implementation: IServiceConstructor<
      T,
      GetServiceTypeImplementation<TArgs>
    >,
    dependencies: TArgs,
  ) {
    super({
      dependencies,
      create: (dependencies) =>
        new implementation(
          ...(dependencies as GetServiceTypeImplementation<TArgs>),
        ),
    });
  }
}
