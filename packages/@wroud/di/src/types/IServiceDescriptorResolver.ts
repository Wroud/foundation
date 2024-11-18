import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceDescriptorResolver {
  <T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, T, unknown>;
}
