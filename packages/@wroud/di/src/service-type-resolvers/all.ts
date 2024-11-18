import type { IResolverServiceType, ServiceType } from "../types/index.js";
import { ListServiceTypeResolver } from "./ListServiceTypeResolver.js";

export function all<T>(service: ServiceType<T>): IResolverServiceType<T, T[]> {
  return new ListServiceTypeResolver(service);
}
