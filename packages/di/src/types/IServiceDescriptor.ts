import type { IServiceImplementation } from "./IServiceImplementation.js";
import type { ServiceLifetime } from "../di/ServiceLifetime.js";
import type { ServiceType } from "./ServiceType.js";

export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: ServiceType<T>;
  implementation: IServiceImplementation<T>;
  loader: Promise<T> | null;
}
