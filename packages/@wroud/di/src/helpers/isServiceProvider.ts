import { IServiceProvider } from "../di/IServiceProvider.js";

export function isServiceProvider(value: unknown): value is IServiceProvider {
  return value === IServiceProvider;
}
