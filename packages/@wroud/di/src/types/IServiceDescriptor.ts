import type { ServiceLifetime } from "../di/ServiceLifetime.js";
import type { SingleServiceType } from "./SingleServiceType.js";
import type { IServiceImplementationResolver } from "./IServiceImplementationResolver.js";

export interface IServiceDescriptor<T> {
  readonly lifetime: ServiceLifetime;
  readonly service: SingleServiceType<T>;
  readonly resolver: IServiceImplementationResolver<T>;
}
