import type { IResolverServiceType } from "./IResolverServiceType.js";

export interface IServiceMetadata<
  TServices extends IResolverServiceType<any, any>[] = IResolverServiceType<
    any,
    any
  >[],
> {
  name: string | undefined;
  dependencies: TServices;
}
