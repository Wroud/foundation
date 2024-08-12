import type { IAsyncServiceImplementationLoader } from "../interfaces/IAsyncServiceImplementationLoader.js";

export function isAsyncServiceImplementationLoader<T>(
  value: any,
): value is IAsyncServiceImplementationLoader<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "isLoaded" in value &&
    typeof value.isLoaded === "function" &&
    "getImplementation" in value &&
    typeof value.getImplementation === "function" &&
    "load" in value &&
    typeof value.load === "function"
  );
}
