import type {
  IServiceDescriptor,
  IServiceInstanceInfo,
} from "../types/index.js";
import { getNameOfDescriptor } from "../helpers/getNameOfDescriptor.js";

const NOT_INITIALIZED = Symbol("NOT_INITIALIZED");
export class ServiceInstanceInfo<T> implements IServiceInstanceInfo<T> {
  get instance(): T {
    if (!this.initialized) {
      throw new Error(
        `Service "${getNameOfDescriptor(this.descriptor)}" is not initialized (circular dependency)`,
      );
    }

    return this._instance as T;
  }

  get initialized(): boolean {
    return this._instance !== NOT_INITIALIZED;
  }

  disposed: boolean;
  dependents: IServiceInstanceInfo<any>[];
  private _instance: T | typeof NOT_INITIALIZED;
  constructor(public descriptor: IServiceDescriptor<T>) {
    this.disposed = false;
    this.dependents = [];
    this._instance = NOT_INITIALIZED;
  }

  *getInstance(): Generator<any, T | symbol> {
    return this._instance;
  }

  initialize(creator: () => T): T {
    if (this._instance === NOT_INITIALIZED) {
      this._instance = creator();
    }

    return this._instance;
  }

  addDependent(dependent: IServiceInstanceInfo<any>): void {
    this.dependents.push(dependent);
  }

  disposeSync(): void {
    if (this.disposed || !this.initialized) {
      return;
    }

    const instance = this._instance as any;
    const disposeMethod = instance?.[Symbol.dispose] ?? instance?.dispose;
    if (typeof disposeMethod === "function") {
      for (const dependent of this.dependents) {
        dependent.disposeSync();
      }

      Reflect.apply(disposeMethod, instance, []);
      this.disposed = true;
    }
  }

  async disposeAsync(): Promise<void> {
    if (this.disposed || !this.initialized) {
      return;
    }
    const instance = this._instance as any;

    const disposeMethod = instance?.[Symbol.asyncDispose] ?? instance?.dispose;
    if (typeof disposeMethod === "function") {
      this.disposed = true;
      try {
        await Promise.all(
          [...this.dependents].map((dependent) => dependent.disposeAsync()),
        );
        await Reflect.apply(disposeMethod, instance, []);
      } catch (e) {
        this.disposed = false;
        throw e;
      }
    } else {
      this.disposeSync();
    }
  }
}
