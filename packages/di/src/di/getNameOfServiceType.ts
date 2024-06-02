import type { ServiceType } from "./ServiceType.js";

export function getNameOfServiceType(service: ServiceType<any>): string {
  return (typeof service === "object" || typeof service === "function") &&
    service &&
    "name" in service
    ? service.name
    : String(service);
}
