import type { IServiceMetadata } from "../interfaces/IServiceMetadata.js";
import type { MapToServicesType } from "../interfaces/MapToServicesType.js";
import type { ServiceType } from "../interfaces/ServiceType.js";

export class ServiceRegistry {
  private static readonly services: WeakMap<any, IServiceMetadata> =
    new WeakMap();

  static register<
    TClass extends abstract new (...args: MapToServicesType<TServices>) => any,
    TServices extends ServiceType<any>[] = [],
  >(service: TClass, metadata: IServiceMetadata<TServices>) {
    const existing = this.services.get(service);

    if (existing) {
      throw new Error(`Service ${existing.name} is already registered`);
    }

    this.services.set(service, metadata);
  }

  static has(service: any): boolean {
    return this.services.has(service);
  }

  static get(service: any): IServiceMetadata | undefined {
    return this.services.get(service);
  }
}
