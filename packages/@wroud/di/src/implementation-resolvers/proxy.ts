import type {
  IServiceImplementationResolver,
  SingleServiceType,
} from "../types/index.js";
import { ProxyServiceImplementationResolver } from "./ProxyServiceImplementationResolver.js";
import { single } from "../service-type-resolvers/single.js";

export function proxy<T>(
  service: SingleServiceType<T>,
): IServiceImplementationResolver<T> {
  return new ProxyServiceImplementationResolver(single(service));
}
