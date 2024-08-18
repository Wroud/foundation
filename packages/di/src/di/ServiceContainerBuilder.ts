import { Debug } from "../debug.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceProvider } from "./ServiceProvider.js";
import { tryResolveServiceAsync } from "./validation/tryResolveServiceAsync.js";
import { validateAsyncImplementation } from "./validation/validateAsyncImplementation.js";

export class ServiceContainerBuilder extends ServiceCollection {
  private validated: boolean;
  constructor() {
    super();
    this.validated = false;
  }

  async validate(): Promise<void> {
    this.validated = true;
    for (const descriptor of this) {
      await tryResolveServiceAsync(this, descriptor.service, new Set());
    }
  }

  build(): IServiceProvider {
    if (!this.validated && Debug.extended) {
      validateAsyncImplementation(this);
    }
    return new ServiceProvider(new ServiceCollection(this));
  }
}
