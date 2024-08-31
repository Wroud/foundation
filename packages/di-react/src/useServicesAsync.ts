import type { ServiceType } from "@wroud/di";
import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "@wroud/di/di/ServiceProvider.js";
import { isAsyncServiceImplementationLoader } from "@wroud/di/helpers/isAsyncServiceImplementationLoader.js";

export function useServicesAsync<T>(type: ServiceType<T>): T[] {
  const provider = useServiceProvider();

  if (!(provider instanceof ServiceProvider)) {
    throw new Error(
      "useServicesAsync must be used with a ServiceProvider instance",
    );
  }

  const descriptors = ServiceProvider.getDescriptors(provider, type);

  let loaded = true;
  for (const descriptor of descriptors) {
    if (descriptor.loader) {
      throw descriptor.loader;
    }

    if (
      isAsyncServiceImplementationLoader(descriptor.implementation) &&
      !descriptor.implementation.isLoaded()
    ) {
      loaded &&= false;
    }
  }

  if (!loaded) {
    throw provider.getServiceAsync(type);
  }

  return provider.getServices(type);
}
