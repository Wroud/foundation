import { getServiceTypeFromDependency } from "../../helpers/getServiceTypeFromDependency.js";
import type {
  IServiceDescriptor,
  SingleServiceType,
} from "../../types/index.js";
import type { ServiceCollection } from "../ServiceCollection.js";
import { ServiceRegistry } from "../ServiceRegistry.js";
import { validateRequestPath } from "./validateRequestPath.js";

export function tryResolveService<T>(
  collection: ServiceCollection,
  service: SingleServiceType<T>,
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
          getServiceTypeFromDependency(dependency),
          new Set([...path, descriptor]),
        );
      }
    }
  }
}
