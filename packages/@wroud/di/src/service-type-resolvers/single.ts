import type { ServiceType, IResolverServiceType } from "../types/index.js";
import { SingleServiceTypeResolver } from "./SingleServiceTypeResolver.js";

export function single<T>(service: ServiceType<T>): IResolverServiceType<T, T> {
  return new SingleServiceTypeResolver(service);
}
