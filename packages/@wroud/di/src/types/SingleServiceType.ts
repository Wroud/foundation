import type { IAbstractServiceConstructor } from "./IAbstractServiceConstructor.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";

export type SingleServiceType<T, TArgs extends unknown[] = unknown[]> =
  | IServiceConstructor<T, TArgs>
  | IAbstractServiceConstructor<T, TArgs>
  | IServiceFactory<T, TArgs>;
