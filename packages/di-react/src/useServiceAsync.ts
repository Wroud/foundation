import type { ServiceType } from "@wroud/di";
import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "@wroud/di/di/ServiceProvider.js";
import { isAsyncServiceImplementationLoader } from "@wroud/di/helpers/isAsyncServiceImplementationLoader.js";

export function useServiceAsync<T>(type: ServiceType<T>): T {
  const provider = useServiceProvider();

  if (!(provider instanceof ServiceProvider)) {
    throw new Error(
      "useServicesAsync must be used with a ServiceProvider instance",
    );
  }

  const descriptor = ServiceProvider.getDescriptor(provider, type);

  if (descriptor.loader) {
    throw descriptor.loader;
  }

  if (
    isAsyncServiceImplementationLoader(descriptor.implementation) &&
    !descriptor.implementation.isLoaded()
  ) {
    throw provider.getServiceAsync(type);
  }

  return provider.getService(type);
}
