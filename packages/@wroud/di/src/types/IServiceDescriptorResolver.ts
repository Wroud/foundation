import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { RequestPath } from "./RequestPath.js";

export interface IServiceDescriptorResolver {
  <T>(
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, T, unknown>;
}
