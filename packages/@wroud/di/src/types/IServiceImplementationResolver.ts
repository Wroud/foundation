import type { IResolvedServiceImplementation } from "./IResolvedServiceImplementation.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceTypeResolver } from "./IServiceTypeResolver.js";
import type { RequestPath } from "./RequestPath.js";

export interface IServiceImplementationResolver<T> {
  get name(): string;
  resolve(
    resolveService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown>;
}
