import { IServiceProvider } from "../di/IServiceProvider.js";
import type {
  GetServiceTypeImplementation,
  IServiceFactory,
  IServiceImplementationResolver,
  ServiceType,
} from "../types/index.js";
import { FactoryServiceImplementationResolver } from "./FactoryServiceImplementationResolver.js";

export function factory<T>(
  factory: IServiceFactory<T>,
): IServiceImplementationResolver<T>;
export function factory<T, TArgs extends ServiceType<unknown>[]>(
  factory: IServiceFactory<T, GetServiceTypeImplementation<TArgs>>,
  ...dependencies: TArgs
): IServiceImplementationResolver<T>;
export function factory(
  factory: IServiceFactory<any, any[]>,
  ...dependencies: any[]
): IServiceImplementationResolver<any> {
  if (dependencies.length === 0) {
    dependencies = [IServiceProvider];
  }
  return new FactoryServiceImplementationResolver(factory, dependencies);
}
