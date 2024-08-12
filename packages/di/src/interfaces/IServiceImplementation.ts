import type { IAsyncServiceImplementationLoader } from "./IAsyncServiceImplementationLoader.js";
import type { ISyncServiceImplementation } from "./ISyncServiceImplementation.js";

export type IServiceImplementation<T> =
  | ISyncServiceImplementation<T>
  | IAsyncServiceImplementationLoader<T>;
