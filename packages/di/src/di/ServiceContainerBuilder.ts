import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceProvider } from "./ServiceProvider.js";
import { tryResolveServiceAsync } from "./validation/tryResolveServiceAsync.js";

export class ServiceContainerBuilder extends ServiceCollection {
  constructor() {
    super();
  }

  async validate(): Promise<void> {
    for (const descriptor of this) {
      await tryResolveServiceAsync(this, descriptor.service, new Set());
    }
  }

  build(): IServiceProvider {
    return new ServiceProvider(new ServiceCollection(this));
  }
}
