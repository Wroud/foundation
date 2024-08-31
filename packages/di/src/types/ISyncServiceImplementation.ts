import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export type ISyncServiceImplementation<T> =
  | IServiceConstructor<T>
  | IServiceFactory<T>
  | T;
