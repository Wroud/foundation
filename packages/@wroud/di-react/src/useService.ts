import type { ServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";
import { single, isServiceTypeResolver } from "@wroud/di";

export function useService<T>(type: ServiceType<T>): T {
  if (!isServiceTypeResolver(type)) {
    type = single(type);
  }
  return useServiceIterator(type);
}
