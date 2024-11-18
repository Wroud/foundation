import type { IResolverServiceType } from "./IResolverServiceType.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export type ServiceType<T> =
  | SingleServiceType<T>
  | IResolverServiceType<any, T>;
