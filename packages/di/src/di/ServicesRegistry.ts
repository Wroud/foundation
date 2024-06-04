import type { ServiceType } from "./ServiceType.js";

export interface IServiceMetadata {
  name: string | undefined;
  dependencies: ServiceType<any>[];
}

export class ServicesRegistry {
  static readonly services: WeakMap<any, IServiceMetadata> = new WeakMap();

  static register(service: any, metadata: IServiceMetadata) {
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
