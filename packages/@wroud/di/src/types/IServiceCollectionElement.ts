import type { IServiceDescriptor } from "./IServiceDescriptor.js";

export interface IServiceCollectionElement<T> {
  single: IServiceDescriptor<T>;
  all: IServiceDescriptor<T>[];
}
