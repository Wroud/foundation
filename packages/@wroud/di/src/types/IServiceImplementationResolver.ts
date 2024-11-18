import type { IResolvedServiceImplementation } from "./IResolvedServiceImplementation.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceTypeResolver } from "./IServiceTypeResolver.js";

export interface IServiceImplementationResolver<T> {
  get name(): string;
  resolve(
    resolveService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown>;
}
