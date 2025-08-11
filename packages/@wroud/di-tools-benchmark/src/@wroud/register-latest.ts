import {
  createService,
  injectable,
  IServiceProvider,
  ServiceContainerBuilder,
} from "@wroud/di-latest";
import { registerLibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import type { SingleServiceType } from "@wroud/di-latest/types";

registerLibrary<
  ServiceContainerBuilder,
  { provider: IServiceProvider; dispose: () => void },
  SingleServiceType<any>,
  new () => any
>("@wroud/di latest", {
  setup: {
    createContainerBuilder: () => new ServiceContainerBuilder(),
    createService: (dependencies) => {
      return @injectable(() => dependencies)
      class Service {
        constructor(...deps: any[]) {}
      };
    },
    createToken() {
      return createService("");
    },
  },
  prepare: {
    createProvider: (builder) => {
      const provider = builder.build();
      return {
        provider,
        dispose: () => {
          //@ts-ignore
          provider[Symbol.dispose]();
        },
      };
    },
    createScopedProvider: (provider) => {
      const scope = provider.provider.createScope();

      return {
        provider: scope.serviceProvider,
        dispose: () => {
          //@ts-ignore
          scope[Symbol.dispose]();
        },
      };
    },
    registerSingleton: (builder, token, service) => {
      builder.addSingleton(token, service);
    },
    registerTransient: (builder, token, service) => {
      builder.addTransient(token, service);
    },
    registerScoped: (builder, token, service) => {
      builder.addScoped(token, service);
    },
  },
  resolve: {
    get: (provider, token) => provider.provider.getService(token),
  },
  dispose: {
    disposeProvider: (provider) => {
      provider.dispose();
    },
  },
});
