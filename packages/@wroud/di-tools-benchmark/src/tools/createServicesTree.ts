export interface IServicePair<TService, TImplementation> {
  service: TService;
  impl: TImplementation;
}

export function createServicesTree<TService, TImplementation>(
  deep: number,
  level: number,
  services: IServicePair<TService, TImplementation>[],
  getService: (i: number) => TService,
  getImplementation: (i: number, deps: TService[]) => TImplementation,
): IServicePair<TService, TImplementation> | undefined {
  if (level === deep) {
    return;
  }

  const deps: IServicePair<TService, TImplementation>[] = [];

  for (let i = 0; i < level + 1; i++) {
    const dep = createServicesTree(
      deep,
      level + 1,
      services,
      getService,
      getImplementation,
    );
    if (dep) {
      deps.push(dep);
    }
  }

  const service = {
    service: getService(level),
    impl: getImplementation(
      level,
      deps.map((d) => d.service),
    ),
  };
  services.push(service);

  return service;
}
