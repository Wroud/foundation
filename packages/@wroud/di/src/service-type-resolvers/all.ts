import type { IResolverServiceType, ServiceType } from "../types/index.js";
import { ListServiceTypeResolver } from "./ListServiceTypeResolver.js";

const cache = new WeakMap<
  ServiceType<unknown>,
  IResolverServiceType<unknown, unknown[]>
>();

export function all<T>(service: ServiceType<T>): IResolverServiceType<T, T[]> {
  let cached = cache.get(service) as IResolverServiceType<T, T[]>;
  if (!cached) {
    cached = new ListServiceTypeResolver(service);
    cache.set(service, cached);
  }
  return cached;
}
