import type { SingleServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";

export function useServices<T>(type: SingleServiceType<T>): T[] {
  return useServiceIterator([type]);
}
