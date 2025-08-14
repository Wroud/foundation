import { Debug } from "../debug.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  GetServiceTypeImplementation,
  IResolvedServiceImplementation,
  IServiceFactory,
  ServiceType,
} from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class FactoryServiceImplementationResolver<
  T,
  TArgs extends ServiceType<unknown>[],
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  private readonly resolved: IResolvedServiceImplementation<T>;
  constructor(
    private readonly implementation: IServiceFactory<
      T,
      GetServiceTypeImplementation<TArgs>
    >,
    dependencies: TArgs,
  ) {
    super();
    this.resolved = {
      dependencies,
      create: (dependencies) => {
        try {
          return implementation(
            ...(dependencies as GetServiceTypeImplementation<TArgs>),
          );
        } catch (err) {
          if (
            err instanceof TypeError &&
            err.message.includes("cannot be invoked without 'new'")
          ) {
            throw new Error(
              Debug.errors.classNotDecorated(implementation.name),
              {
                cause: err,
              },
            );
          } else {
            throw err;
          }
        }
      },
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
