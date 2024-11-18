import type { IServiceCollection } from "@wroud/di";
import type {
  IServiceDescriptor,
  SingleServiceType,
  IServiceImplementation,
} from "@wroud/di/types";

export class ServiceCollectionProxy {
  private readonly modules: Map<IServiceDescriptor<unknown>, string>;
  constructor(private readonly collection: IServiceCollection) {
    this.modules = new Map();
  }

  getModules() {
    return this.modules;
  }

  proxy(name: string): IServiceCollection {
    const collection = this.collection;
    const modules = this.modules;
    function addToModule(service: SingleServiceType<any>) {
      const descriptor = collection.getDescriptors(service);

      if (descriptor.length > 0) {
        modules.set(descriptor[descriptor.length - 1]!, name);
      }
    }
    return {
      getDescriptor: <T>(
        service: SingleServiceType<T>,
      ): IServiceDescriptor<T> => {
        return collection.getDescriptor(service);
      },
      getDescriptors<T>(
        service: SingleServiceType<T>,
      ): IServiceDescriptor<T>[] {
        return collection.getDescriptors(service);
      },
      addScoped<T>(
        service: SingleServiceType<T>,
        resolver?: IServiceImplementation<T>,
      ) {
        collection.addScoped(service, resolver as any);
        addToModule(service);
        return this;
      },
      addTransient<T>(
        service: SingleServiceType<T>,
        resolver?: IServiceImplementation<T>,
      ) {
        collection.addTransient(service, resolver as any);
        addToModule(service);
        return this;
      },
      addSingleton<T>(
        service: SingleServiceType<T>,
        resolver?: IServiceImplementation<T>,
      ) {
        collection.addSingleton(service, resolver);
        addToModule(service);
        return this;
      },
      [Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, any> {
        return collection[Symbol.iterator]();
      },
    };
  }
}
