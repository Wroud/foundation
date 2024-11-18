import type { SingleServiceType } from "@wroud/di/types";
import { useServiceIterator } from "./useServiceIterator.js";
import { single } from "@wroud/di";

export function useService<T>(type: SingleServiceType<T>): T {
  return useServiceIterator(single(type));
}
