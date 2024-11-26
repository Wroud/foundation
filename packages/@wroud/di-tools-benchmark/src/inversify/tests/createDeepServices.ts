import { decorate, inject, injectable } from "inversify";

interface IServicePair {
  service: symbol;
  impl: new (...args: any[]) => any;
}

export function createDeepServices(deep: number): {
  lastService: symbol;
  services: readonly IServicePair[];
} {
  const services: IServicePair[] = [];

  let lastService: symbol | null = null;

  for (let i = 0; i < deep; i++) {
    const service = Symbol(`service${i}`);
    class impl {}

    decorate(injectable(), impl);
    if (lastService) {
      decorate(inject(lastService), impl, 0);
    }

    lastService = service;
    services.push({ service, impl });
  }

  return { lastService: lastService!, services };
}
