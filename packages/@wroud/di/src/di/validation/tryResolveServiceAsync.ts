import type {
  IServiceDescriptor,
  SingleServiceType,
} from "../../types/index.js";
import type { ServiceCollection } from "../ServiceCollection.js";
import { ServiceRegistry } from "../ServiceRegistry.js";
import { isAsyncServiceImplementationLoader } from "../../helpers/isAsyncServiceImplementationLoader.js";
import { validateRequestPath } from "./validateRequestPath.js";
import { getServiceTypeFromDependency } from "../../helpers/getServiceTypeFromDependency.js";

export async function tryResolveServiceAsync<T>(
  collection: ServiceCollection,
  service: SingleServiceType<T>,
  path: Set<IServiceDescriptor<any>>,
): Promise<void> {
  const descriptors = collection.getDescriptors(service);

  for (const descriptor of descriptors) {
    let implementation = descriptor.implementation;

    if (isAsyncServiceImplementationLoader(implementation)) {
      implementation = await implementation.load();
    }

    validateRequestPath(path, descriptor);

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      for (const dependency of metadata.dependencies) {
        await tryResolveServiceAsync(
          collection,
          getServiceTypeFromDependency(dependency),
          new Set([...path, descriptor]),
        );
      }
    }
  }
}
