import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import type { IReactiveValue } from "./IReactiveValue.js";

export function useReactiveValues<
  P extends IReactiveValue<any, any[]> | undefined,
>(
  value: P,
  onChange?: (
    ...args: P extends IReactiveValue<any, infer T> ? T : never[]
  ) => void,
) {
  const onChangeRef = useRef(onChange);
  const valueChangeRef = useRef(() => {});
  const subscribeRef = useRef<Array<() => void>>([]);

  onChangeRef.current = onChange;

  for (const unsubscribe of subscribeRef.current) {
    unsubscribe();
  }
  subscribeRef.current = [];

  const mappedValue = useMemo(
    () => ({
      cache: null as any,
      cacheInvalidated: true,
      subscribe: (onValueChange: () => void) => {
        valueChangeRef.current = onValueChange;

        return () => {
          for (const unsubscribe of subscribeRef.current) {
            unsubscribe();
          }
        };
      },
      get: () => {
        if (mappedValue.cacheInvalidated) {
          mappedValue.cache = {};
          mappedValue.cacheInvalidated = false;
        }
        return mappedValue.cache;
      },
    }),
    [value],
  );

  useSyncExternalStore(mappedValue.subscribe, mappedValue.get, mappedValue.get);

  return useCallback(
    (
      ...args: P extends IReactiveValue<any, infer T> ? T : never[]
    ): P extends IReactiveValue<infer T, any[]> ? T : undefined => {
      if (value) {
        subscribeRef.current.push(
          value.subscribe(
            () => {
              mappedValue.cacheInvalidated = true;
              valueChangeRef.current();
              onChangeRef.current?.(...args);
            },
            ...args,
          ),
        );

        return value.get(...args);
      }

      return undefined as any;
    },
    [value],
  );
}
