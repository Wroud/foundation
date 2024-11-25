import type {
  IServiceDescriptor,
  IServiceInstanceInfo,
  IServiceInstancesStore,
} from "../types/index.js";
import { ServiceInstanceInfo } from "./ServiceInstanceInfo.js";
import { isServiceProvider } from "../helpers/isServiceProvider.js";

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
    requestedBy: IServiceDescriptor<any> | null,
  ): IServiceInstanceInfo<T> {
    let instanceInfo = this.getInstanceInfo(descriptor);

    if (!instanceInfo) {
      instanceInfo = new ServiceInstanceInfo(descriptor);
      this.instances.set(descriptor, instanceInfo);
    }

    if (requestedBy) {
      const dependentInstanceInfo = this.getInstanceInfo(requestedBy);

      if (dependentInstanceInfo) {
        instanceInfo.addDependent(dependentInstanceInfo);
      }
    }
    return instanceInfo;
  }

  [Symbol.dispose]() {
    for (const instanceInfo of this) {
      if (!isServiceProvider(instanceInfo.descriptor.service)) {
        instanceInfo.disposeSync();
      }
    }
    this.instances.clear();
  }

  async [Symbol.asyncDispose]() {
    await Promise.all(
      [...this.instances.values()].map(async (instanceInfo) => {
        if (!isServiceProvider(instanceInfo.descriptor.service)) {
          await instanceInfo.disposeAsync();
        }
      }),
    );

    this.instances.clear();
  }
}
