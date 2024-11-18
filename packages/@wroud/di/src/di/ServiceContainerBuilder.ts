import { Debug } from "../debug.js";
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
      descriptor.dry = true;
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
        descriptor.dry = true;
      }

      for (const descriptor of collectionCopy) {
        provider.serviceProvider.getServices(descriptor.service);
      }

      provider[Symbol.dispose]();
      validateAsyncImplementation(this);
    }
    return new ServiceProvider(new ServiceCollection(this));
  }
}
