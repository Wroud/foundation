import { AsyncServiceImplementationLoader } from "./AsyncServiceImplementationLoader.js";
import type { IAsyncServiceImplementationLoader } from "../interfaces/IAsyncServiceImplementationLoader.js";

export function diLazy<T>(
  loader: () => Promise<T>,
): IAsyncServiceImplementationLoader<T> {
  return new AsyncServiceImplementationLoader(loader);
}
