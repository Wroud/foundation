import type {
  IServiceMetadata,
  MapToServicesType,
  ServiceType,
} from "../types/index.js";

export class ServiceRegistry {
  private static readonly meta = new WeakMap<Function, IServiceMetadata>();

  static register<
    TClass extends abstract new (...args: MapToServicesType<TServices>) => any,
    TServices extends ServiceType<any>[] = [],
  >(service: TClass, metadata: IServiceMetadata<TServices>) {
    if (this.meta.has(service)) {
      throw new Error(`Service ${service.name} is already registered`);
    }
    this.meta.set(service, metadata);
  }

  static has(service: any): boolean {
    return this.meta.has(service);
  }

  static get(service: any): IServiceMetadata | undefined {
    return this.meta.get(service);
  }
}
