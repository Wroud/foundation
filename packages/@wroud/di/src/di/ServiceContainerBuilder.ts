import { Debug } from "../debug.js";
import { isExternalServiceImplementationResolver } from "../extras/implementation-resolvers/ExternalServiceImplementationResolver.js";
import { DryImplementationResolver } from "../implementation-resolvers/DryImplementationResolver.js";
import { isAsyncServiceImplementationResolver } from "../implementation-resolvers/isAsyncServiceImplementation.js";
import { ValueServiceImplementationResolver } from "../implementation-resolvers/ValueServiceImplementationResolver.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceProvider } from "./ServiceProvider.js";
import { validateAsyncImplementation } from "./validation/validateAsyncImplementation.js";

export class ServiceContainerBuilder extends ServiceCollection {
  private validated: boolean;
  constructor() {
    super();
    this.validated = false;
  }

  async validate(): Promise<void> {
    this.validated = true;
    const collectionCopy = new ServiceCollection(this);
    const provider = new ServiceProvider(collectionCopy).createAsyncScope();

    for (const descriptor of collectionCopy) {
      if (isExternalServiceImplementationResolver(descriptor.resolver)) {
        // @ts-expect-error
        descriptor.resolver = new ValueServiceImplementationResolver(null);
      }
      // @ts-expect-error
      descriptor.resolver = new DryImplementationResolver(descriptor.resolver);
    }

    for (const descriptor of collectionCopy) {
      await provider.serviceProvider.getServicesAsync(descriptor.service);
    }

    await provider[Symbol.asyncDispose]();
  }

  build(): IServiceProvider {
    if (!this.validated && Debug.extended) {
      const collectionCopy = new ServiceCollection(this);
      const provider = new ServiceProvider(collectionCopy).createScope();

      for (const descriptor of collectionCopy) {
        if (
          isExternalServiceImplementationResolver(descriptor.resolver) ||
          isAsyncServiceImplementationResolver(descriptor.resolver)
        ) {
          // @ts-expect-error
          descriptor.resolver = new ValueServiceImplementationResolver(null);
        }
        // @ts-expect-error
        descriptor.resolver = new DryImplementationResolver(
          descriptor.resolver,
        );
      }

      for (const descriptor of collectionCopy) {
        provider.serviceProvider.getServices(descriptor.service);
      }

      provider[Symbol.dispose]();
      validateAsyncImplementation(this);
    }

    this.addService = () => {
      throw new Error(
        "Cannot add services after the container has been built.",
      );
    };
    return new ServiceProvider(this);
  }
}
