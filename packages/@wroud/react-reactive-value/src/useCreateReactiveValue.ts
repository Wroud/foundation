import { useMemo } from "react";
import type {
  IReactiveValue,
  IReactiveValueSubscribe,
} from "./IReactiveValue.js";

type NoInfer<T> = intrinsic;
export function useCreateReactiveValue<T, TArgs extends any[]>(
  get: (...args: TArgs) => T,
  subscribe: NoInfer<IReactiveValueSubscribe<TArgs>> | null,
  deps: React.DependencyList,
): IReactiveValue<T, TArgs> {
  const value = useMemo<IReactiveValue<T, TArgs>>(
    () => ({
      get,
      subscribe: subscribe ?? (() => () => {}),
    }),
    deps,
  );

  return value;
}
