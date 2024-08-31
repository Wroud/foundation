import { useContext } from "react";
import { ServiceProviderContext } from "./ServiceProviderContext.js";

export function useServiceProvider() {
  const serviceProvider = useContext(ServiceProviderContext);

  if (!serviceProvider) {
    throw new Error("No service provider found in the context.");
  }

  return serviceProvider;
}
