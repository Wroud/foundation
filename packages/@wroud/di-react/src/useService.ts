import type { SingleServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";

export function useService<T>(type: SingleServiceType<T>): T {
  return useServiceIterator(type);
}
