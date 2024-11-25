import {
  createServicesTree,
  type IServicePair,
} from "@wroud/di-tools-benchmark/tools/createServicesTree";
import { decorate, injectable, inject } from "inversify";

export type ServicePair = IServicePair<symbol, new (...args: any[]) => any>;
export function createServicesTreeInversify(
  deep: number,
  level: number,
  services: ServicePair[],
): ServicePair | undefined {
  return createServicesTree(
    deep,
    level,
    services,
    (i) => Symbol(`service${i}`),
    (level, deps) => {
      class Impl {
        constructor(...service: any[]) {}
      }

      decorate(injectable(), Impl);
      for (let i = 0; i < deps.length; i++) {
        decorate(inject(deps[i]!), Impl, i);
      }
      return Impl;
    },
  );
}
