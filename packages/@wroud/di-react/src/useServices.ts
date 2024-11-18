import type { SingleServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";
import { all } from "@wroud/di";

export function useServices<T>(type: SingleServiceType<T>): T[] {
  return useServiceIterator(all(type));
}
