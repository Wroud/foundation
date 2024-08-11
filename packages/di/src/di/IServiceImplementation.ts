import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export type IServiceImplementation<T> =
  | IServiceConstructor<T>
  | IServiceFactory<T>
  | T;
