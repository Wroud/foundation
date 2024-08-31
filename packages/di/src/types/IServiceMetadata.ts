import type { ServiceType } from "./ServiceType.js";

export interface IServiceMetadata<
  TServices extends ServiceType<any>[] = ServiceType<any>[],
> {
  name: string | undefined;
  dependencies: TServices;
}
