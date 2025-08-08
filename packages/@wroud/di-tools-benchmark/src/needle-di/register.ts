import { Container, inject, injectable, type Token } from "@needle-di/core";
import { registerLibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";

registerLibrary<Container, Container, Token<any>, new () => any>("needle-di", {
  setup: {
    createContainerBuilder: () => new Container(),
    createService: (dependencies) => {
      return @injectable()
      class Service {
        constructor() {
          dependencies.map(inject);
        }
      };
    },
    createToken() {
      return Symbol();
    },
  },
  prepare: {
    createProvider: (builder) => builder,
    createScopedProvider: (provider) => provider.createChild(),
    registerSingleton: (builder, token, service) => {
      builder.bind({ provide: token, useClass: service });
    },
  },
  resolve: {
    get: (provider, token) => provider.get(token),
  },
});
