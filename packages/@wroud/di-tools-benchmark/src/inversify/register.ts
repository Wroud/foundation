import "reflect-metadata";
import { registerLibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import {
  Container,
  injectable,
  type interfaces,
  decorate,
  inject,
} from "inversify";

registerLibrary<
  Container,
  Container,
  interfaces.ServiceIdentifier,
  new () => any
>("inversify", {
  setup: {
    createContainerBuilder: () => new Container(),
    createService: (dependencies) => {
      @injectable()
      class Service {
        constructor() {}
      }

      for (let i = 0; i < dependencies.length; i++) {
        decorate(inject(dependencies[i]!), Service, i);
      }

      return Service;
    },
    createToken() {
      return Symbol();
    },
  },
  prepare: {
    createProvider: (builder) => builder,
    createScopedProvider: (provider) => provider.createChild(),
    registerSingleton: (builder, token, service) => {
      builder.bind(token).to(service).inSingletonScope();
    },
    registerTransient: (builder, token, service) => {
      builder.bind(token).to(service).inTransientScope();
    },
  },
  resolve: {
    get: (provider, token) => provider.get(token) as any,
  },
});
