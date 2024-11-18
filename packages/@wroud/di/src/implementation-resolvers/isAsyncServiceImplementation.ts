import { AsyncServiceImplementationResolver } from "./AsyncServiceImplementationResolver.js";

export function isAsyncServiceImplementationResolver<T>(
  value: any,
): value is AsyncServiceImplementationResolver<T> {
  return value instanceof AsyncServiceImplementationResolver;
}
