import type { ServiceType, IResolverServiceType } from "../types/index.js";
import { SingleServiceTypeResolver } from "./SingleServiceTypeResolver.js";

const cache = new WeakMap<
  ServiceType<unknown>,
  IResolverServiceType<unknown, unknown>
>();

export function single<T>(service: ServiceType<T>): IResolverServiceType<T, T> {
  let cached = cache.get(service) as IResolverServiceType<T, T>;
  if (!cached) {
    cached = new SingleServiceTypeResolver(service);
    cache.set(service, cached);
  }
  return cached;
}
