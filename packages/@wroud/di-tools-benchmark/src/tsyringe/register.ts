import "reflect-metadata";
import {
  container,
  inject,
  injectable,
  Lifecycle,
  type DependencyContainer,
} from "tsyringe";
import { registerLibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";

registerLibrary<
  DependencyContainer,
  DependencyContainer,
  symbol,
  new () => any
>("tsyringe", {
  setup: {
    createContainerBuilder: () => container.createChildContainer(),
    createService: (dependencies) => {
      class Service {
        constructor(...args: any[]) {}
      }

      Reflect.defineMetadata(
        "design:paramtypes",
        dependencies.map(() => Object),
        Service,
      );

      dependencies.forEach((token, index) => {
        inject(token)(Service, undefined, index);
      });
      injectable()(Service);
      return Service;
    },
    createToken() {
      return Symbol();
    },
  },
  prepare: {
    createProvider: (builder) => builder,
    createScopedProvider: (provider) => provider.createChildContainer(),
    registerSingleton: (builder, token, service) => {
      builder.register(token, service, { lifecycle: Lifecycle.Singleton });
    },
    registerTransient: (builder, token, service) => {
      builder.register(token, service, { lifecycle: Lifecycle.Transient });
    },
    registerScoped: (builder, token, service) => {
      builder.register(token, service, {
        lifecycle: Lifecycle.ContainerScoped,
      });
    },
  },
  resolve: {
    get: (provider, token) => provider.resolve(token),
  },
  dispose: {
    disposeProvider: (provider) => {
      provider.dispose();
    },
  },
});
