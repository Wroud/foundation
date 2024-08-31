import type { IServiceDescriptor, ServiceType } from "../../types/index.js";
import type { ServiceCollection } from "../ServiceCollection.js";
import { ServiceRegistry } from "../ServiceRegistry.js";
import { validateRequestPath } from "./validateRequestPath.js";

export function tryResolveService<T>(
  collection: ServiceCollection,
  service: ServiceType<T>,
  path: Set<IServiceDescriptor<any>>,
): void {
  const descriptors = collection.getDescriptors(service);

  for (const descriptor of descriptors) {
    let implementation = descriptor.implementation;

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
