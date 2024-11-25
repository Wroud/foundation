import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "@wroud/di/di/ServiceProvider.js";
import type { IResolverServiceType } from "@wroud/di/types";

export function useServiceIterator<T>(type: IResolverServiceType<any, T>): T {
  const provider = useServiceProvider();

  let result: IteratorResult<Promise<unknown>, T>;
  const iterator = ServiceProvider.internalGetService(
    provider,
    type,
    null,
    { next: null, value: null },
    "async",
  );

  while (!(result = iterator.next()).done) {
    throw result.value;
  }

  return result.value;
}
