import { registerLibrary } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import { Container, injected, type Token, token } from "brandi";

registerLibrary<Container, Container, Token, new () => any>("brandi", {
  setup: {
    createContainerBuilder: () => new Container(),
    createService: (dependencies) => {
      class Service {
        constructor(...deps: any[]) {}
      }

      //@ts-ignore
      injected(Service, ...dependencies);

      return Service;
    },
    createToken() {
      return token("");
    },
  },
  prepare: {
    createProvider: (builder) => builder,
    createScopedProvider: (provider) => new Container().extend(provider),
    registerSingleton: (builder, token, service) => {
      builder.bind(token).toInstance(service).inSingletonScope();
    },
    registerTransient: (builder, token, service) => {
      builder.bind(token).toInstance(service).inTransientScope();
    },
    registerScoped: (builder, token, service) => {
      builder.bind(token).toInstance(service).inContainerScope();
    },
  },
  resolve: {
    get: (provider, token) => provider.get(token) as any,
  },
});
