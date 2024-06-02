import type { IModule } from "./IModule.js";
export interface IModuleEventListener {
    (module: IModule): void;
}
export declare class ModuleRegistry {
    private static modules;
    private static listeners;
    static register(module: IModule): void;
    static getModules(): IModule[];
    static addListener(listener: IModuleEventListener): void;
}
//# sourceMappingURL=ModuleRegistry.d.ts.map