import { useMemo, useSyncExternalStore } from "react";
import type { IReactiveValue } from "./IReactiveValue.js";

export function useReactiveValue<
  P extends IReactiveValue<any, any[]> | undefined,
>(
  value: P,
  ...args: P extends IReactiveValue<any, infer T> ? T : never
): P extends IReactiveValue<infer T, any[]> ? T : undefined {
  const mappedValue = useMemo(
    () => ({
      cache: null as any,
      cacheInvalidated: true,
      subscribe: (onValueChange: () => void) => {
        if (value) {
          return value.subscribe(
            () => {
              mappedValue.cacheInvalidated = true;
              return onValueChange();
            },
            ...args,
          );
        }

        return () => {};
      },
      get: () => {
        if (mappedValue.cacheInvalidated) {
          mappedValue.cache = value?.get(...args);
          mappedValue.cacheInvalidated = false;
        }
        return mappedValue.cache;
      },
    }),
    [value, ...args],
  );
  return useSyncExternalStore(
    mappedValue.subscribe,
    mappedValue.get,
    mappedValue.get,
  );
}
