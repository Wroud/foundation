import type { IResolverServiceType, ServiceType } from "../types/index.js";
import {
  OptionalServiceTypeResolver,
  type IOptionalService,
} from "./OptionalServiceTypeResolver.js";

export type { IOptionalService };
export function optional<T>(
  service: ServiceType<T>,
): IResolverServiceType<T, IOptionalService<T>> {
  return new OptionalServiceTypeResolver(service);
}
