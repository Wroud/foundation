import type { ISyncServiceImplementation } from "./ISyncServiceImplementation.js";
import type { ServiceLifetime } from "./ServiceLifetime.js";
import type { ServiceType } from "./ServiceType.js";

export interface IServiceDescriptor<T> {
  lifetime: ServiceLifetime;
  service: ServiceType<T>;
  implementation: ISyncServiceImplementation<T>;
}
