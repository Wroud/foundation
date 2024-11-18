import type { ServiceLifetime } from "../di/ServiceLifetime.js";
import type { SingleServiceType } from "./SingleServiceType.js";
import type { IServiceImplementationResolver } from "./IServiceImplementationResolver.js";

export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: SingleServiceType<T>;
  resolver: IServiceImplementationResolver<T>;
  dry?: boolean;
}
