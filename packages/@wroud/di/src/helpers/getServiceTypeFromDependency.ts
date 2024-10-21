import type { ServiceType } from "../types/ServiceType.js";
import type { SingleServiceType } from "../types/SingleServiceType.js";

export function getServiceTypeFromDependency<T>(
  dependency: ServiceType<T>,
): SingleServiceType<T> {
  if (Array.isArray(dependency)) {
    return dependency[0]!;
  }
  return dependency;
}
