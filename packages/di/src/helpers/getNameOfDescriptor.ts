import type { IServiceDescriptor } from "../types/index.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
import { isAsyncServiceImplementationLoader } from "./isAsyncServiceImplementationLoader.js";

export function getNameOfDescriptor(
  descriptor: IServiceDescriptor<unknown>,
): string {
  let implementation = descriptor.implementation;

  if (isAsyncServiceImplementationLoader(implementation)) {
    if (implementation.isLoaded()) {
      implementation = implementation.getImplementation();
    } else {
      implementation = { name: "lazy(?)" };
    }
  }

  const serviceName = getNameOfServiceType(descriptor.service);
  const implementationName = getNameOfServiceType(implementation);

  return implementationName === serviceName
    ? `${implementationName}`
    : `${implementationName} (${serviceName})`;
}
