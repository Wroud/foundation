import type {
  IAsyncServiceScope,
  IServiceScope,
  ServiceType,
} from "../types/index.js";
import { createService } from "./createService.js";

export const IServiceProvider =
  createService<IServiceProvider>("IServiceProvider");
export interface IServiceProvider {
  getService<T>(constructor: ServiceType<T>): T;
  getServiceAsync<T>(constructor: ServiceType<T>): Promise<T>;
  getServices<T>(constructor: ServiceType<T>): T[];
  getServicesAsync<T>(constructor: ServiceType<T>): Promise<T[]>;
  createAsyncScope(): IAsyncServiceScope;
  createScope(): IServiceScope;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): Promise<void>;
}
