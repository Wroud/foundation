import type { IServiceDescriptor } from "../types/index.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
import { isJsEntityName } from "./isJsEntityName.js";

export function getNameOfDescriptor(
  descriptor: IServiceDescriptor<unknown>,
): string {
  let resolver = descriptor.resolver;

  const serviceName = getNameOfServiceType(descriptor.service);
  const implementationName = getNameOfServiceType(resolver);

  if (isJsEntityName(implementationName)) {
    return serviceName;
  }

  if (implementationName === serviceName) {
    return implementationName;
  }

  return `${implementationName} (${serviceName})`;
}
