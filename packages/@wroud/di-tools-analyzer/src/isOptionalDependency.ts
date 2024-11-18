import { isServiceTypeResolver } from "@wroud/di/service-type-resolvers/BaseServiceTypeResolver.js";
import { isOptionalServiceTypeResolver } from "@wroud/di/service-type-resolvers/OptionalServiceTypeResolver.js";
import type { IResolverServiceType } from "@wroud/di/types";

export function isOptionalDependency(
  resolver: IResolverServiceType<any, any>,
): boolean {
  let current: IResolverServiceType<any, any> | null = resolver;
  while (current) {
    if (isOptionalServiceTypeResolver(current)) {
      return true;
    }

    current = isServiceTypeResolver(resolver.next) ? resolver.next : null;
  }

  return false;
}
