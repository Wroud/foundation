import type { IResolverServiceType } from "./IResolverServiceType.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { RequestPath } from "./RequestPath.js";

export interface IServiceTypeResolver {
  <T>(
    service: IResolverServiceType<any, T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, T, unknown>;
}
