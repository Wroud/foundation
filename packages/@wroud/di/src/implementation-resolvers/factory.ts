import type {
  GetServiceTypeImplementation,
  IServiceFactory,
  IServiceImplementationResolver,
  ServiceType,
} from "../types/index.js";
import { FactoryServiceImplementationResolver } from "./FactoryServiceImplementationResolver.js";

export function factory<T, TArgs extends ServiceType<unknown>[]>(
  factory: IServiceFactory<T, GetServiceTypeImplementation<TArgs>>,
  ...dependencies: TArgs
): IServiceImplementationResolver<T> {
  return new FactoryServiceImplementationResolver(factory, dependencies);
}
