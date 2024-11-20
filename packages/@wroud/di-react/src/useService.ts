import type { ServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";
import { single } from "@wroud/di";
import { isServiceTypeResolver } from "@wroud/di/service-type-resolvers/BaseServiceTypeResolver.js";

export function useService<T>(type: ServiceType<T>): T {
  if (!isServiceTypeResolver(type)) {
    type = single(type);
  }
  return useServiceIterator(type);
}
