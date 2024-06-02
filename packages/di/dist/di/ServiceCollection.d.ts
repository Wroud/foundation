import type { IServiceCollection } from "./IServiceCollection.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import { type IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { ServiceImplementation } from "./ServiceImplementation.js";
import type { ServiceType } from "./ServiceType.js";
export declare class ServiceCollection implements IServiceCollection {
    private readonly collection;
    constructor();
    [Symbol.iterator](): Iterator<IServiceDescriptor<unknown>, any, undefined>;
    getDescriptors(service: any): IServiceDescriptor<unknown>[];
    addScoped<T>(service: ServiceImplementation<T>): this;
    addScoped<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
    addScoped<T>(service: ServiceType<T>, constructor: IServiceConstructor<T>): this;
    addTransient<T>(service: ServiceImplementation<T>): this;
    addTransient<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
    addTransient<T>(service: ServiceType<T>, constructor: IServiceConstructor<T>): this;
    addSingleton<T>(service: ServiceImplementation<T>): this;
    addSingleton<T>(service: ServiceType<T>, implementation: T): this;
    addSingleton<T>(service: ServiceType<T>, constructor: IServiceConstructor<T>): this;
    addSingleton<T>(service: ServiceType<T>, factory: IServiceFactory<T>): this;
    private addService;
    private tryResolveService;
}
//# sourceMappingURL=ServiceCollection.d.ts.map