import { ServiceCollection } from "../di/ServiceCollection.js";
import { ServiceProvider } from "../di/ServiceProvider.js";
import type { SingleServiceType } from "../types/SingleServiceType.js";

export function tryResolveService<T>(
  collection: ServiceCollection,
  service: SingleServiceType<T>,
) {
  const collectionCopy = new ServiceCollection(collection);
  const provider = new ServiceProvider(collectionCopy).createScope();

  for (const descriptor of collectionCopy) {
    descriptor.dry = true;
  }

  provider.serviceProvider.getService(service);
  provider[Symbol.dispose]();
}
