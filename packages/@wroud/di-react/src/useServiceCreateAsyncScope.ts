import { useEffect, useRef } from "react";
import { useAbandonedRenderDisposer } from "./useAbandonedRenderDisposer.js";
import { useServiceProvider } from "./useServiceProvider.js";
import type { IAsyncServiceScope } from "@wroud/di";

export function useServiceCreateAsyncScope() {
  const serviceProvider = useServiceProvider();
  const ref = useRef(null as IAsyncServiceScope | null);

  if (ref.current === null) {
    ref.current = serviceProvider.createAsyncScope();
  }

  function dispose() {
    ref.current?.[Symbol.asyncDispose]();
    ref.current = null;
  }

  useAbandonedRenderDisposer(dispose);
  useEffect(() => dispose, [serviceProvider]);

  return ref.current;
}
