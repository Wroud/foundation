import type { ServiceType } from "./ServiceType.js";
export interface IServiceMetadata {
    name: string | undefined;
    dependencies: ServiceType<any>[];
}
export declare class ServiceRegistry {
    private static readonly services;
    static register(service: any, metadata: IServiceMetadata): void;
    static has(service: any): boolean;
    static get(service: any): IServiceMetadata | undefined;
}
//# sourceMappingURL=ServicesRegistry.d.ts.map