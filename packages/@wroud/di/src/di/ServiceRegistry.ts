import type {
  IServiceMetadata,
  MapToServicesType,
  IResolverServiceType,
} from "../types/index.js";

export class ServiceRegistry {
  private static metadataKey = Symbol("service-metadata");

  static register<
    TClass extends abstract new (...args: MapToServicesType<TServices>) => any,
    TServices extends IResolverServiceType<any, any>[] = [],
  >(service: TClass, metadata: IServiceMetadata<TServices>) {
    if (ServiceRegistry.has(service)) {
      throw new Error(`Service ${service.name} is already registered`);
    }

    Object.defineProperty(service, this.metadataKey, {
      value: metadata,
      writable: false,
    });
  }

  static has(service: any): boolean {
    return this.metadataKey in service;
  }

  static get(service: any): IServiceMetadata | undefined {
    return service[this.metadataKey];
  }
}
