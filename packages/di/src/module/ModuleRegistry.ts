import type { IModule } from "./IModule.js";

export interface IModuleEventListener {
  (module: IModule): void;
}

export class ModuleRegistry {
  private static modules: IModule[] = [];
  private static listeners: IModuleEventListener[] = [];

  static register(module: IModule) {
    if (this.modules.some((m) => m.name === module.name)) {
      throw new Error(`Module ${module.name} is already registered.`);
    }
    this.modules.push(module);
    this.listeners.forEach((listener) => listener(module));
  }

  static getModules() {
    return this.modules;
  }

  static addListener(listener: IModuleEventListener) {
    this.listeners.push(listener);
  }
}
