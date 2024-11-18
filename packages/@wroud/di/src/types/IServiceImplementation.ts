import type { IServiceImplementationResolver } from "./IServiceImplementationResolver.js";
import type { SingleServiceImplementation } from "./ServiceImplementation.js";

export type IServiceImplementation<T> =
  | T
  | SingleServiceImplementation<T>
  | IServiceImplementationResolver<T>;
