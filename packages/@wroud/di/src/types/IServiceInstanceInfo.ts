import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceInstanceInfo<T> {
  descriptor: IServiceDescriptor<T>;
  instance: T;
  dependents: Set<IServiceInstanceInfo<any>>;
  initialized: boolean;
  disposed: boolean;
  initialize(creator: () => T): void;
  addDependent(dependent: IServiceInstanceInfo<any>): void;
  disposeSync(): void;
  disposeAsync(): Promise<void>;
}
