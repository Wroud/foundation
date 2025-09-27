import type { SingleServiceType } from "../../types/index.js";
import { ExternalServiceTypeResolver } from "./ExternalServiceTypeResolver.js";

export function withExternal<T>(service: SingleServiceType<T, any[]>) {
  return new ExternalServiceTypeResolver(service);
}
