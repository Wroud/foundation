import { isAsyncServiceImplementationLoader } from "@wroud/di/helpers/isAsyncServiceImplementationLoader.js";
import type { IServiceDescriptor } from "@wroud/di/types";

export async function loadImplementation<T>(descriptor: IServiceDescriptor<T>) {
  let implementation = descriptor.implementation;

  if (isAsyncServiceImplementationLoader(implementation)) {
    implementation = await implementation.load();
  }

  return implementation;
}
