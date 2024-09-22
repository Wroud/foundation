import type {
  IServiceDescriptor,
  IServiceInstanceInfo,
} from "../types/index.js";
import { getNameOfDescriptor } from "../helpers/getNameOfDescriptor.js";

export class ServiceInstanceInfo<T> implements IServiceInstanceInfo<T> {
  get instance(): T {
    if (!this.initialized) {
      throw new Error(
        `Service "${getNameOfDescriptor(this.descriptor)}" is not initialized (circular dependency)`,
      );
    }

    return this._instance!;
  }

  initialized: boolean;
  disposed: boolean;
  dependents: Set<IServiceInstanceInfo<any>>;
  private _instance: T | undefined;
  constructor(public descriptor: IServiceDescriptor<T>) {
    this.initialized = false;
    this.disposed = false;
    this.dependents = new Set();
  }

  initialize(creator: () => T): void {
    if (this.initialized) {
      return;
    }
    this._instance = creator();
    this.initialized = true;
  }

  addDependent(dependent: IServiceInstanceInfo<any>): void {
    this.dependents.add(dependent);
  }

  disposeSync(): void {
    const instance = this.instance as any;
    if (
      typeof instance[Symbol.dispose] === "function" &&
      !this.disposed &&
      this.initialized
    ) {
      for (const dependent of this.dependents) {
        dependent.disposeSync();
      }

      instance[Symbol.dispose]();
      this.disposed = true;
    }
  }

  async disposeAsync(): Promise<void> {
    const instance = this.instance as any;

    if (!this.disposed && this.initialized) {
      if (typeof instance[Symbol.asyncDispose] === "function") {
        this.disposed = true;
        try {
          await Promise.all(
            [...this.dependents].map((dependent) => dependent.disposeAsync()),
          );
          await instance[Symbol.asyncDispose]();
        } catch (e) {
          this.disposed = false;
          throw e;
        }
      } else {
        this.disposeSync();
      }
    }
  }
}
