import { ServiceRegistry } from "../di/ServiceRegistry.js";
import { IServiceProvider } from "../di/IServiceProvider.js";
import type { IServiceConstructor } from "../types/IServiceConstructor.js";
import type { IServiceFactory } from "../types/IServiceFactory.js";
import type { IServiceImplementationResolver } from "../types/IServiceImplementationResolver.js";
import type { SingleServiceImplementation } from "../types/ServiceImplementation.js";
import { isServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";
import { constructor } from "./constructor.js";
import { factory } from "./factory.js";
import { value } from "./value.js";

export function fallback<T>(
  implementation:
    | T
    | SingleServiceImplementation<T>
    | IServiceImplementationResolver<T>,
) {
  if (isServiceImplementationResolver(implementation)) {
    return implementation;
  }

  const metadata = ServiceRegistry.get(implementation);

  if (metadata) {
    return constructor(
      implementation as IServiceConstructor<T>,
      ...metadata.dependencies,
    );
  }

  if (typeof implementation === "function") {
    return factory(implementation as IServiceFactory<T>, IServiceProvider);
  }

  return value(implementation);
}
