import type { ISyncServiceImplementation } from "./ISyncServiceImplementation.js";

export interface IAsyncServiceImplementationLoader<T> {
  isLoaded(): boolean;
  getImplementation(): ISyncServiceImplementation<T>;
  load(): Promise<ISyncServiceImplementation<T>>;
}
