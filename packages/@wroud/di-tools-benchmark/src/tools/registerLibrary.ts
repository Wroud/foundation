const libraries = new Map<
  string,
  ILibrary<unknown, unknown, unknown, unknown>
>();

export interface ILibrary<TBuilder, TProvider, TToken, TService> {
  setup: {
    createContainerBuilder: () => TBuilder;
    createToken: () => TToken;
    createService: (dependencies: TToken[]) => TService;
  };

  prepare: {
    registerSingleton: (
      builder: TBuilder,
      token: TToken,
      service: TService,
    ) => void;
    registerTransient?: (
      builder: TBuilder,
      token: TToken,
      service: TService,
    ) => void;
    registerScoped?: (
      builder: TBuilder,
      token: TToken,
      service: TService,
    ) => void;
    createProvider: (builder: TBuilder) => TProvider;
    createScopedProvider?: (provider: TProvider) => TProvider;
  };

  resolve: {
    get: (provider: TProvider, token: TToken) => TService;
  };

  dispose?: {
    disposeProvider?: (provider: TProvider) => void;
    disposeBuilder?: (builder: TBuilder) => void;
  };
}

export function registerLibrary<TBuilder, TProvider, TToken, TService>(
  name: string,
  lib: ILibrary<TBuilder, TProvider, TToken, TService>,
) {
  libraries.set(name, lib as ILibrary<unknown, unknown, unknown, unknown>);
}

export function getLibraries(): Map<
  string,
  ILibrary<unknown, unknown, unknown, unknown>
> {
  return libraries;
}
