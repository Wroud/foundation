import { AsyncServiceImplementationLoader } from "./AsyncServiceImplementationLoader.js";
import type { IAsyncServiceImplementationLoader } from "../interfaces/IAsyncServiceImplementationLoader.js";

export function lazy<T>(
  loader: () => Promise<T>,
): IAsyncServiceImplementationLoader<T> {
  return new AsyncServiceImplementationLoader(loader);
}
