import type { IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceInstanceInfo } from "./IServiceInstanceInfo.js";
import type { IServiceInstancesStore } from "./IServiceInstancesStore.js";
import { isServiceProvider } from "./IServiceProvider.js";

export class ServiceInstancesStore implements IServiceInstancesStore {
  private readonly instances: Map<
    IServiceDescriptor<any>,
    IServiceInstanceInfo<any>
  >;
  constructor() {
    this.instances = new Map();
  }

  [Symbol.iterator](): Iterator<IServiceInstanceInfo<any>, any, undefined> {
    return this.instances.values();
  }

  hasInstanceOf<T>(descriptor: IServiceDescriptor<T>): boolean {
    return this.instances.has(descriptor);
  }

  getInstanceInfo<T>(
    descriptor: IServiceDescriptor<T>,
  ): IServiceInstanceInfo<T> | undefined {
    return this.instances.get(descriptor);
  }

  addInstance<T>(
    descriptor: IServiceDescriptor<T>,
    instance: T,
  ): IServiceInstanceInfo<T> {
    const instanceInfo: IServiceInstanceInfo<T> = {
      descriptor,
      instance,
      dependents: [],
      disposed: false,
    };
    this.instances.set(descriptor, instanceInfo);
    return instanceInfo;
  }

  [Symbol.dispose]() {
    for (const instanceInfo of this) {
      this.disposeInstanceSync(instanceInfo);
    }
    this.instances.clear();
  }

  async [Symbol.asyncDispose]() {
    await Promise.all(
      [...this.instances.values()].map((instanceInfo) =>
        this.disposeInstanceAsync(instanceInfo),
      ),
    );

    this.instances.clear();
  }

  private disposeInstanceSync(instanceInfo: IServiceInstanceInfo<any>) {
    if (
      isServiceProvider(instanceInfo.descriptor.service) ||
      instanceInfo.disposed
    ) {
      return;
    }

    for (const dependent of instanceInfo.dependents) {
      this.disposeInstanceSync(dependent);
    }

    if (
      typeof instanceInfo.instance[Symbol.dispose] === "function" &&
      !instanceInfo.disposed
    ) {
      instanceInfo.instance[Symbol.dispose]();
      instanceInfo.disposed = true;
    }
  }

  private async disposeInstanceAsync(
    instanceInfo: IServiceInstanceInfo<any>,
  ): Promise<void> {
    if (
      isServiceProvider(instanceInfo.descriptor.service) ||
      instanceInfo.disposed
    ) {
      return;
    }

    await Promise.all(
      instanceInfo.dependents.map((dependent) =>
        this.disposeInstanceAsync(dependent),
      ),
    );

    if (
      typeof instanceInfo.instance[Symbol.asyncDispose] === "function" &&
      !instanceInfo.disposed
    ) {
      await instanceInfo.instance[Symbol.asyncDispose]();
      instanceInfo.disposed = true;
    }
  }
}
