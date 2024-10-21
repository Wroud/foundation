import { useServiceProvider } from "./useServiceProvider.js";
import type { SingleServiceType } from "@wroud/di/types";

export function useServicesSync<T>(type: SingleServiceType<T>): T[] {
  const provider = useServiceProvider();
  return provider.getServices(type);
}
