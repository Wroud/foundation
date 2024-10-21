import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "@wroud/di/di/ServiceProvider.js";
import type { ServiceType, SingleServiceType } from "@wroud/di/types";

export function useServiceIterator<T>(type: SingleServiceType<T>): T;
export function useServiceIterator<T>(type: SingleServiceType<T>[]): T[];
export function useServiceIterator<T>(type: ServiceType<T>): T | T[] {
  const provider = useServiceProvider();

  let result: IteratorResult<Promise<unknown>, T | T[]>;
  const iterator = ServiceProvider.internalGetService(
    provider,
    type,
    new Set(),
    "async",
  );

  while (!(result = iterator.next()).done) {
    throw result.value;
  }

  return result.value;
}
