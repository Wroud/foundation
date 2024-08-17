import { AsyncServiceImplementationError } from "./errors/AsyncServiceImplementationError.js";
import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type { IAsyncServiceImplementationLoader } from "../interfaces/IAsyncServiceImplementationLoader.js";
import type { ISyncServiceImplementation } from "../interfaces/ISyncServiceImplementation.js";

const NOT_LOADED = Symbol("NOT_LOADED");

export class AsyncServiceImplementationLoader<T>
  implements IAsyncServiceImplementationLoader<T>
{
  get name(): string {
    if (this.implementation === NOT_LOADED) {
      return `Service implementation not loaded, loader: ${String(this.loader)}`;
    }
    return getNameOfServiceType(this.implementation);
  }

  private implementation: ISyncServiceImplementation<T> | typeof NOT_LOADED;
  private promise: Promise<ISyncServiceImplementation<T>> | null;

  constructor(private loader: () => Promise<ISyncServiceImplementation<T>>) {
    this.implementation = NOT_LOADED;
    this.promise = null;
  }

  isLoaded(): boolean {
    return this.implementation !== NOT_LOADED;
  }

  getImplementation(): ISyncServiceImplementation<T> {
    if (this.implementation === NOT_LOADED) {
      throw new AsyncServiceImplementationError();
    }
    return this.implementation;
  }

  async load(): Promise<ISyncServiceImplementation<T>> {
    if (this.implementation !== NOT_LOADED) {
      return this.implementation;
    }
    if (!this.promise) {
      this.promise = this.loader()
        .then((implementation) => {
          this.implementation = implementation;
          return implementation;
        })
        .finally(() => {
          this.promise = null;
        });
    }
    return this.promise;
  }
}
