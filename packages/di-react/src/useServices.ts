import type { ServiceType } from "@wroud/di";
import { useServiceProvider } from "./useServiceProvider.js";

export function useServices<T>(type: ServiceType<T>): T[] {
  const provider = useServiceProvider();
  return provider.getServices(type);
}
