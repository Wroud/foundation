import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceInstanceInfo<T> {
  descriptor: IServiceDescriptor<T>;
  instance: T;
  dependents: IServiceInstanceInfo<any>[];
  initialized: boolean;
  disposed: boolean;
  getInstance(): Generator<any, T | symbol>;
  initialize(creator: () => T): T;
  addDependent(dependent: IServiceInstanceInfo<any>): void;
  disposeSync(): void;
  disposeAsync(): Promise<void>;
}
