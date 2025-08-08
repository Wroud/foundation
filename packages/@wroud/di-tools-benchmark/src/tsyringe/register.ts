import "reflect-metadata";
import {
  container,
  injectable,
  Lifecycle,
  inject,
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
      @injectable()
      class Service {
        constructor() {}
      }

      for (let i = 0; i < dependencies.length; i++) {
        inject(dependencies[i]!)(Service, undefined, i);
      }

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
