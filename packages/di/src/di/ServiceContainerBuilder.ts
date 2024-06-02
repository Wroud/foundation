import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceProvider } from "./ServiceProvider.js";

export class ServiceContainerBuilder extends ServiceCollection {
  constructor() {
    super();
  }

  build(): IServiceProvider {
    return new ServiceProvider(this);
  }
}
