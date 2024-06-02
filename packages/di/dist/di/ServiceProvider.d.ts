import type { IAsyncServiceScope } from "./IAsyncServiceScope.js";
import { IServiceProvider } from "./IServiceProvider.js";
import type { IServiceScope } from "./IServiceScope.js";
import { ServiceCollection } from "./ServiceCollection.js";
import type { ServiceType } from "./ServiceType.js";
export declare class ServiceProvider implements IServiceProvider {
    private readonly collection;
    private readonly parent?;
    private readonly instances;
    constructor(collection: ServiceCollection, parent?: IServiceProvider | undefined);
    getServices<T>(service: ServiceType<T>): T[];
    getService<T>(service: ServiceType<T>): T;
    createScope(): IServiceScope;
    createAsyncScope(): IAsyncServiceScope;
    private createInstanceFromDescriptor;
    private hasInstanceOf;
    private getInstanceInfo;
    private addInstance;
    [Symbol.dispose](): void;
    [Symbol.asyncDispose](): Promise<void>;
}
//# sourceMappingURL=ServiceProvider.d.ts.map