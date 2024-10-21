import type { IServiceImplementation } from "./IServiceImplementation.js";
import type { ServiceLifetime } from "../di/ServiceLifetime.js";
import type { SingleServiceType } from "./SingleServiceType.js";

export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: SingleServiceType<T>;
  implementation: IServiceImplementation<T>;
}
