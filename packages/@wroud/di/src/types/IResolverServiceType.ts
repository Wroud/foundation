import type { IServiceCollection } from "./IServiceCollection.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceDescriptorResolver } from "./IServiceDescriptorResolver.js";
import type { ServiceType } from "./ServiceType.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IResolverServiceType<In, Out> {
  readonly name: string;
  readonly service: SingleServiceType<In>;
  readonly next: ServiceType<In>;
  resolve(
    collection: IServiceCollection,
    resolveService: IServiceDescriptorResolver,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
    descriptor?: IServiceDescriptor<In>,
  ): Generator<Promise<unknown>, Out, unknown>;
}
