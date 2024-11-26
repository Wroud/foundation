import { createService, injectable, single } from "@wroud/di";
import type { ServiceType, SingleServiceType } from "@wroud/di/types";
import type { IServicePair } from "./IServicePair.js";

export function createDeepServices(deep: number): {
  lastService: ServiceType<any>;
  services: readonly IServicePair[];
} {
  const services: IServicePair[] = [];

  let lastService: SingleServiceType<any> | null = null;

  for (let i = 0; i < deep; i++) {
    const service = createService(`service${i}`);

    //@ts-ignore
    @injectable(lastService ? () => [single(lastService)] : undefined)
    class impl {}

    lastService = service;
    services.push({ service, impl });
  }

  return { lastService: single(lastService!), services };
}
