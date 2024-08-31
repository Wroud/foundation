import { useEffect, useRef } from "react";
import { useAbandonedRenderDisposer } from "./useAbandonedRenderDisposer.js";
import { useServiceProvider } from "./useServiceProvider.js";
import type { IServiceScope } from "@wroud/di";

export function useServiceCreateScope() {
  const serviceProvider = useServiceProvider();
  const ref = useRef(null as IServiceScope | null);

  if (ref.current === null) {
    ref.current = serviceProvider.createScope();
  }

  function dispose() {
    ref.current?.[Symbol.dispose]();
    ref.current = null;
  }

  useAbandonedRenderDisposer(dispose);
  useEffect(() => dispose, [serviceProvider]);

  return ref.current;
}
