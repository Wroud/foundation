import type { IResolvedServiceImplementationCreator } from "./IResolvedServiceImplementation.js";
import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceInstanceInfo<T> extends Iterator<never, T | symbol> {
  descriptor: IServiceDescriptor<T>;
  instance: T;
  dependents: IServiceInstanceInfo<any>[];
  initialized: boolean;
  disposed: boolean;
  initialize(
    creator: IResolvedServiceImplementationCreator<T>,
    dependencies: readonly any[],
  ): T;
  addDependent(dependent: IServiceInstanceInfo<any>): void;
  disposeSync(): void;
  disposeAsync(): Promise<void>;
}
