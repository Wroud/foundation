import { isServiceTypeResolver } from "@wroud/di/service-type-resolvers/BaseServiceTypeResolver.js";
import { isOptionalServiceTypeResolver } from "@wroud/di/service-type-resolvers/OptionalServiceTypeResolver.js";
import type { ServiceType } from "@wroud/di/types";

export function isOptionalDependency(dependency: ServiceType<any>): boolean {
  let current: ServiceType<any> | null = dependency;
  while (isServiceTypeResolver(current)) {
    if (isOptionalServiceTypeResolver(current)) {
      return true;
    }

    current = current.next;
  }

  return false;
}
