import { EMPTY_DEPS } from "../helpers/EMPTY_DEPS.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IResolverServiceType,
  IServiceTypeResolver,
  RequestPath,
} from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ProxyServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.service);
  }

  constructor(private readonly service: IResolverServiceType<any, T>) {
    super();
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    const implementation = yield* internalGetService(
      this.service,
      requestedBy,
      requestedPath,
      mode,
    );
    return {
      implementation,
      dependencies: EMPTY_DEPS,
      create: () => implementation,
    };
  }
}
