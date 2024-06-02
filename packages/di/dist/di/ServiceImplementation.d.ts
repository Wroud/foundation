import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
export type SingleServiceImplementation<T> = IServiceConstructor<T> | IServiceFactory<T>;
export type ServiceImplementation<T> = SingleServiceImplementation<T> | SingleServiceImplementation<T>[];
//# sourceMappingURL=ServiceImplementation.d.ts.map