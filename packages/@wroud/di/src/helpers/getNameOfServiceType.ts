import type {
  IServiceImplementation,
  SingleServiceType,
} from "../types/index.js";

export function getNameOfServiceType(
  service: SingleServiceType<any> | IServiceImplementation<any>,
): string {
  if (
    !["object", "function"].includes(typeof service) ||
    service === null ||
    service === undefined
  ) {
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
