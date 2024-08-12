import type { IServiceImplementation } from "../interfaces/IServiceImplementation.js";
import type { ServiceType } from "../interfaces/ServiceType.js";

export function getNameOfServiceType(
  service: ServiceType<any> | IServiceImplementation<any>,
): string {
  if (!["object", "function"].includes(typeof service) || service === null) {
    return String(service);
  }

  if ("name" in service && service.name) {
    return String(service.name);
  }

  if ("constructor" in service && service.constructor?.name) {
    return String(service.constructor.name);
  }

  let prototype = Object.getPrototypeOf(service);

  while (prototype) {
    if (prototype && prototype?.name) {
      return String(prototype?.name);
    }

    if (prototype && prototype?.constructor?.name) {
      return String(prototype?.constructor?.name);
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return String(service);
}
