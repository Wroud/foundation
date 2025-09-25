import type { IServiceCollection } from "./IServiceCollection.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceDescriptorResolver } from "./IServiceDescriptorResolver.js";
import type { IServiceInstancesStore } from "./IServiceInstancesStore.js";
import type { RequestPath } from "./RequestPath.js";
import type { ServiceType } from "./ServiceType.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IResolverServiceType<In, Out> {
  readonly name: string;
  readonly service: SingleServiceType<In>;
  readonly next: ServiceType<In>;
  resolve(
    collection: IServiceCollection,
    instancesStore: IServiceInstancesStore,
    resolveService: IServiceDescriptorResolver,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
    descriptor?: IServiceDescriptor<In>,
  ): Generator<Promise<unknown>, Out, unknown>;
}
