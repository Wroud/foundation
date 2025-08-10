import type { ServiceType } from "./ServiceType.js";

export interface IResolvedServiceImplementationCreator<T> {
  (dependencies: readonly any[]): T;
}
export interface IResolvedServiceImplementation<T> {
  implementation: T;
  dependencies: readonly ServiceType<any>[];
  create: IResolvedServiceImplementationCreator<T>;
}
