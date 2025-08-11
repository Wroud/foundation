import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceConstructor,
  IServiceTypeResolver,
  RequestPath,
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
      create: (dependencies) =>
        new this.implementation(
          ...(dependencies as GetServiceTypeImplementation<TArgs>),
        ),
    };
  }
}
