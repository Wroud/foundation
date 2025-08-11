import type {
  GetServiceTypeImplementation,
  IServiceConstructor,
  IServiceImplementationResolver,
  ServiceType,
} from "../types/index.js";
import { ConstructorServiceImplementationResolver } from "./ConstructorServiceImplementationResolver.js";

export function constructor<T, TArgs extends ServiceType<unknown>[]>(
  constructor: IServiceConstructor<T, GetServiceTypeImplementation<TArgs>>,
  ...dependencies: TArgs
): IServiceImplementationResolver<T> {
  return new ConstructorServiceImplementationResolver(
    constructor,
    dependencies,
  );
}
