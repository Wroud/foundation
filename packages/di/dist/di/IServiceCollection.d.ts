import type { IServiceConstructor } from "./IServiceConstructor.js";
import { type IServiceDescriptor } from "./IServiceDescriptor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { ServiceImplementation } from "./ServiceImplementation.js";
import type { ServiceType } from "./ServiceType.js";
export interface IServiceCollection extends Iterable<IServiceDescriptor<unknown>> {
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
}
//# sourceMappingURL=IServiceCollection.d.ts.map