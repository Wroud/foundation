import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { RequestPath } from "./RequestPath.js";
import type { ServiceType } from "./ServiceType.js";

export interface IServiceTypeResolver {
  <T>(
    service: ServiceType<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, T, unknown>;
}
