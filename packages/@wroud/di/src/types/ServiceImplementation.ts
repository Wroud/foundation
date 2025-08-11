import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export type SingleServiceImplementation<T> =
  | IServiceConstructor<T, any[]>
  | IServiceFactory<T, any[]>;

export type ServiceImplementation<T> =
  | SingleServiceImplementation<T>
  | SingleServiceImplementation<T>[];
