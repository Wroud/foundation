import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
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

  private readonly resolved: IResolvedServiceImplementation<T>;
  constructor(
    private readonly implementation: IServiceConstructor<
      T,
      GetServiceTypeImplementation<TArgs>
    >,
    dependencies: TArgs,
  ) {
    super();

    this.resolved = {
      dependencies,
      create: (dependencies) =>
        new implementation(
          ...(dependencies as GetServiceTypeImplementation<TArgs>),
        ),
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
