import type {
  IServiceImplementation,
  SingleServiceType,
} from "../types/index.js";

export function getNameOfServiceType(
  service: SingleServiceType<any, any> | IServiceImplementation<any>,
): string {
  if (service === null) return "null";
  if (service === undefined) return "undefined";

  const serviceType = typeof service;

  // Handle primitives (string, number, boolean, symbol, bigint)
  if (serviceType !== "object" && serviceType !== "function") {
    return String(service);
  }

  // Handle functions and objects with name property
  if (service.name) {
    return String(service.name);
  }

  // Handle objects/instances via constructor
  const constructor = service.constructor;
  if (constructor?.name) {
    return constructor.name;
  }

  // Traverse prototype chain for complex inheritance scenarios
  let prototype = Object.getPrototypeOf(service);
  while (prototype && prototype !== Object.prototype) {
    if (prototype.name) {
      return String(prototype.name);
    }

    const prototypeConstructor = prototype.constructor;
    if (prototypeConstructor?.name) {
      return prototypeConstructor.name;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return String(service);
}
