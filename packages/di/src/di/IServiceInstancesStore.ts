import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceInstanceInfo } from "./IServiceInstanceInfo.js";

export interface IServiceInstancesStore
  extends Iterable<IServiceInstanceInfo<any>> {
  hasInstanceOf<T>(descriptor: IServiceDescriptor<T>): boolean;
  getInstanceInfo<T>(
    descriptor: IServiceDescriptor<T>,
  ): IServiceInstanceInfo<T> | undefined;
  addInstance<T>(
    descriptor: IServiceDescriptor<T>,
    instance: T,
  ): IServiceInstanceInfo<T>;
  addDependent<T>(
    instanceInfo: IServiceDescriptor<T>,
    dependent: IServiceDescriptor<any>,
  ): void;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): Promise<void>;
}
