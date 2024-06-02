import type { IAsyncServiceScope } from "./IAsyncServiceScope.js";
import type { IServiceScope } from "./IServiceScope.js";
import type { ServiceType } from "./ServiceType.js";
import { createService } from "./createService.js";

export const IServiceProvider =
  createService<IServiceProvider>("IServiceProvider");
export interface IServiceProvider {
  getService<T>(constructor: ServiceType<T>): T;
  getServices<T>(constructor: ServiceType<T>): T[];
  createAsyncScope(): IAsyncServiceScope;
  createScope(): IServiceScope;
  [Symbol.dispose](): void;
}
