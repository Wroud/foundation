import { isServiceTypeResolver } from "../service-type-resolvers/BaseServiceTypeResolver.js";
import type { ServiceType, SingleServiceType } from "../types/index.js";

export function getServiceTypeFromDependency<T>(
  dependency: ServiceType<T>,
): SingleServiceType<T> {
  if (isServiceTypeResolver<unknown, T>(dependency)) {
    return dependency.service as SingleServiceType<T>;
  }
  return dependency;
}
