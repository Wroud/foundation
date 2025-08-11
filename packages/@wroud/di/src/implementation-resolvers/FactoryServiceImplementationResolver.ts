import { Debug } from "../debug.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  GetServiceTypeImplementation,
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceFactory,
  IServiceTypeResolver,
  RequestPath,
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

  constructor(
    private readonly implementation: IServiceFactory<
      T,
      GetServiceTypeImplementation<TArgs>
    >,
    private readonly dependencies: TArgs,
  ) {
    super();
  }

  *resolve(
    getService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    return {
      dependencies: this.dependencies,
      create: (dependencies) => {
        try {
          return this.implementation(
            ...(dependencies as GetServiceTypeImplementation<TArgs>),
          );
        } catch (err) {
          if (
            err instanceof TypeError &&
            err.message.includes("cannot be invoked without 'new'")
          ) {
            throw new Error(
              Debug.errors.classNotDecorated(this.implementation.name),
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
}
