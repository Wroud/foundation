import type { IServiceImplementationResolver } from "../types/index.js";
import { AsyncServiceImplementationResolver } from "./AsyncServiceImplementationResolver.js";

export function lazy<T>(
  loader: () => Promise<T | IServiceImplementationResolver<T>>,
): IServiceImplementationResolver<T> {
  return new AsyncServiceImplementationResolver(loader);
}
