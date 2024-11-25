//@ts-ignore
import { inject, injectable } from "tsyringe";

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
    let impl;
    if (!lastService) {
      @injectable()
      class implementation {}
      impl = implementation;
    } else {
      @injectable()
      class implementation {
        // @ts-ignore
        constructor(@inject(lastService) public service: any) {}
      }
      impl = implementation;
    }

    lastService = service;
    services.push({ service, impl });
  }

  return { lastService: lastService!, services };
}
