import type { IModule } from "./IModule.js";

export interface IModuleEventListener {
  (module: IModule): void;
}

export class ModuleRegistry {
  static [Symbol.iterator](): IterableIterator<IModule> {
    return this.modules.values();
  }
  private static modules: Map<string, IModule> = new Map();
  private static listeners: IModuleEventListener[] = [];

  static add(module: IModule): void {
    if (this.has(module.name)) {
      throw new Error(`Module ${module.name} is already added.`);
    }
    this.modules.set(module.name, module);
    this.listeners.forEach((listener) => listener(module));
  }

  static has(name: string): boolean {
    return this.modules.has(name);
  }

  static get(name: string): IModule | undefined {
    return this.modules.get(name);
  }

  static addListener(listener: IModuleEventListener): void {
    this.listeners.push(listener);
  }
}
