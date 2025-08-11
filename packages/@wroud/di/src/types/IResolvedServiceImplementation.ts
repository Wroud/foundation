import type { ServiceType } from "./ServiceType.js";

export interface IResolvedServiceImplementationCreator<T> {
  (dependencies: readonly unknown[]): T;
}
export interface IResolvedServiceImplementation<T> {
  dependencies: readonly ServiceType<unknown>[];
  create: IResolvedServiceImplementationCreator<T>;
}
