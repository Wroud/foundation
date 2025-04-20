import { ServiceLifetime } from "@wroud/di/di/ServiceLifetime.js";
import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "@wroud/di/di/ServiceProvider.js";
import type { IResolverServiceType } from "@wroud/di/types";
import { useEffect, useRef } from "react";

const unset = Symbol("unset");

export function useServiceIterator<T>(type: IResolverServiceType<any, T>): T {
  const provider = useServiceProvider();
  const ref = useRef<T | typeof unset>(unset);
  const typeRef = useRef(type);
  const providerRef = useRef(provider);

  useEffect(
    () => () => {
      if (ref.current !== unset) {
        const descriptor = ServiceProvider.getDescriptor(
          providerRef.current,
          typeRef.current.service,
        );
        if (descriptor.lifetime === ServiceLifetime.Transient) {
          dispose(ref.current);
        }
      }
    },
    [],
  );

  if (
    ref.current !== unset &&
    typeRef.current.service === type.service &&
    providerRef.current === provider
  ) {
    return ref.current;
  }

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

  if (ref.current !== unset) {
    const descriptor = ServiceProvider.getDescriptor(
      providerRef.current,
      typeRef.current.service,
    );
    if (descriptor.lifetime === ServiceLifetime.Transient) {
      dispose(ref.current);
    }
  }

  ref.current = result.value;
  typeRef.current = type;
  providerRef.current = provider;

  return result.value;
}

function dispose<T>(value: T): void {
  if (typeof value === "object" && value !== null) {
    if (Symbol.dispose in value) {
      (value as Disposable)[Symbol.dispose]();
    } else if (Symbol.asyncDispose in value) {
      (value as AsyncDisposable)[Symbol.asyncDispose]();
    } else if (Array.isArray(value)) {
      for (const item of value) {
        dispose(item);
      }
    }
  }
}
