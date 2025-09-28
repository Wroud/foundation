import type { IResolverServiceType } from "./IResolverServiceType.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export type ServiceType<T> =
  | SingleServiceType<T, any>
  | IResolverServiceType<unknown, T>;

export type GetServiceTypeImplementation<
  T extends ServiceType<unknown> | ServiceType<unknown>[],
> =
  T extends ServiceType<infer U>
    ? U
    : {
        [K in keyof T]: T[K] extends ServiceType<infer V> ? V : never;
      };
