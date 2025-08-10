import type { IResolverServiceType, ServiceType } from "../types/index.js";
import {
  OptionalServiceTypeResolver,
  type IOptionalService,
} from "./OptionalServiceTypeResolver.js";

const cache = new WeakMap<
  ServiceType<unknown>,
  IResolverServiceType<unknown, IOptionalService<unknown>>
>();

export type { IOptionalService };
export function optional<T>(
  service: ServiceType<T>,
): IResolverServiceType<T, IOptionalService<T>> {
  let cached = cache.get(service) as IResolverServiceType<
    T,
    IOptionalService<T>
  >;
  if (!cached) {
    cached = new OptionalServiceTypeResolver(service);
    cache.set(service, cached);
  }
  return cached;
}
