import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceInstanceInfo<T> {
  descriptor: IServiceDescriptor<T>;
  instance: T;
  dependents: Set<IServiceInstanceInfo<any>>;
  disposed: boolean;
}
