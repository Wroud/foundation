import type { IResolverServiceType } from "./IResolverServiceType.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceTypeResolver {
  <T>(
    service: IResolverServiceType<any, T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown>;
}
