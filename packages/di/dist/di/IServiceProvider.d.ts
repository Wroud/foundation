import type { IAsyncServiceScope } from "./IAsyncServiceScope.js";
import type { IServiceScope } from "./IServiceScope.js";
import type { ServiceType } from "./ServiceType.js";
export declare const IServiceProvider: import("./IServiceConstructor.js").IServiceConstructor<IServiceProvider>;
export interface IServiceProvider {
    getService<T>(constructor: ServiceType<T>): T;
    getServices<T>(constructor: ServiceType<T>): T[];
    createAsyncScope(): IAsyncServiceScope;
    createScope(): IServiceScope;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=IServiceProvider.d.ts.map