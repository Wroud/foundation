import type { MapToServicesType } from "./MapToServicesType.js";
import type { ServiceType } from "./ServiceType.js";

export interface IServiceMetadata<
  TServices extends ServiceType<any>[] = ServiceType<any>[],
> {
  name: string | undefined;
  dependencies: TServices;
}

export class ServicesRegistry {
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
