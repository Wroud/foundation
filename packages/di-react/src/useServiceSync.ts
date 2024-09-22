import { useServiceProvider } from "./useServiceProvider.js";
import type { SingleServiceType } from "@wroud/di/types";

export function useServiceSync<T>(type: SingleServiceType<T>): T {
  const provider = useServiceProvider();
  return provider.getService(type);
}
