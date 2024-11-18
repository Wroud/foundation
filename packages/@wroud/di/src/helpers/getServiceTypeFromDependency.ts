import { isServiceTypeResolver } from "../service-type-resolvers/BaseServiceTypeResolver.js";
import type { ServiceType, SingleServiceType } from "../types/index.js";

export function getServiceTypeFromDependency<T>(
  dependency: ServiceType<T>,
): SingleServiceType<T> {
  if (isServiceTypeResolver(dependency)) {
    return dependency.service;
  }
  return dependency;
}
