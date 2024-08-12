import type { IAbstractServiceConstructor } from "./IAbstractServiceConstructor.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export type SingleServiceType<T> =
  | IServiceConstructor<T>
  | IAbstractServiceConstructor<T>
  | IServiceFactory<T>;
