import type { IServiceProvider } from "./IServiceProvider.js";
export interface IAsyncServiceScope {
    serviceProvider: IServiceProvider;
    [Symbol.asyncDispose](): Promise<void>;
}
//# sourceMappingURL=IAsyncServiceScope.d.ts.map