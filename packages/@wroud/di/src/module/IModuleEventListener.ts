import type { IModule } from "./IModule.js";

export interface IModuleEventListener {
  (module: IModule): void;
}
