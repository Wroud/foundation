import type { IServiceCollection } from "../di/IServiceCollection.js";
export interface IModule {
    name: string;
    configure(serviceCollection: IServiceCollection): Promise<void>;
}
//# sourceMappingURL=IModule.d.ts.map