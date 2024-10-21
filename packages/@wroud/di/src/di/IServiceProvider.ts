import type {
  IAsyncServiceScope,
  IServiceScope,
  SingleServiceType,
} from "../types/index.js";
import { createService } from "./createService.js";

export const IServiceProvider =
  createService<IServiceProvider>("IServiceProvider");
export interface IServiceProvider {
  getService<T>(constructor: SingleServiceType<T>): T;
  getServiceAsync<T>(constructor: SingleServiceType<T>): Promise<T>;
  getServices<T>(constructor: SingleServiceType<T>): T[];
  getServicesAsync<T>(constructor: SingleServiceType<T>): Promise<T[]>;
  createAsyncScope(): IAsyncServiceScope;
  createScope(): IServiceScope;
  [Symbol.dispose](): void;
  [Symbol.asyncDispose](): Promise<void>;
}
