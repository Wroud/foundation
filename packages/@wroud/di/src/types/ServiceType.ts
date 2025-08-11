import type { IResolverServiceType } from "./IResolverServiceType.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export type ServiceType<T> =
  | SingleServiceType<T>
  | IResolverServiceType<unknown, T>;

export type GetServiceTypeImplementation<
  T extends ServiceType<any> | ServiceType<any>[],
> =
  T extends ServiceType<infer U>
    ? U
    : T extends ServiceType<infer U>[]
      ? U[]
      : never;
