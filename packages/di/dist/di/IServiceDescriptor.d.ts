import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
export declare enum ServiceLifetime {
    Singleton = 0,
    Scoped = 1,
    Transient = 2
}
export interface IServiceDescriptor<T> {
    lifetime: ServiceLifetime;
    service: any;
    implementation: IServiceConstructor<T> | IServiceFactory<T> | T;
}
//# sourceMappingURL=IServiceDescriptor.d.ts.map