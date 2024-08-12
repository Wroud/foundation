import type { IServiceDescriptor } from "../../interfaces/IServiceDescriptor.js";
import type { ServiceCollection } from "../ServiceCollection.js";
import { ServiceRegistry } from "../ServiceRegistry.js";
import type { ServiceType } from "../../interfaces/ServiceType.js";
import { getNameOfServiceType } from "../../helpers/getNameOfServiceType.js";
import { isAsyncServiceImplementationLoader } from "../../helpers/isAsyncServiceImplementationLoader.js";
import { validateRequestPath } from "./validateRequestPath.js";

export function tryResolveService<T>(
  collection: ServiceCollection,
  service: ServiceType<T>,
  path: Set<IServiceDescriptor<any>>,
): void {
  const descriptors = collection.getDescriptors(service);

  for (const descriptor of descriptors) {
    let implementation = descriptor.implementation;

    if (isAsyncServiceImplementationLoader(implementation)) {
      console.warn(
        `Service implementation for "${getNameOfServiceType(service)}" is async and cannot be validated synchronously. You can use ServiceContainerBuilder.validate to validate dependencies asynchronously.`,
      );
    }

    validateRequestPath(path, descriptor);

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      for (const dependency of metadata.dependencies) {
        tryResolveService(
          collection,
          Array.isArray(dependency) ? dependency[0]! : dependency,
          new Set([...path, descriptor]),
        );
      }
    }
  }
}
