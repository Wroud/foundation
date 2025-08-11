import type {
  IServiceImplementationResolver,
  SingleServiceType,
} from "../types/index.js";
import { factory } from "./factory.js";

export function proxy<T>(
  service: SingleServiceType<T>,
): IServiceImplementationResolver<T> {
  return factory((service) => service, service);
}
