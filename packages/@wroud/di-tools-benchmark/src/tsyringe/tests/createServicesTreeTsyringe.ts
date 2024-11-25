import {
  createServicesTree,
  type IServicePair,
} from "@wroud/di-tools-benchmark/tools/createServicesTree";
import { inject, injectable } from "tsyringe";

export type ServicePair = IServicePair<symbol, new (...args: any[]) => any>;
export function createServicesTreeTsyringe(
  deep: number,
  level: number,
  services: ServicePair[],
): ServicePair | undefined {
  return createServicesTree(
    deep,
    level,
    services,
    (i) => Symbol(`service${i}`),
    (i, deps) => {
      class Impl {
        constructor(...service: any[]) {}
      }

      for (let i = 0; i < deps.length; i++) {
        inject(deps[i]!)(Impl, undefined, i);
      }
      injectable()(Impl);
      return Impl;
    },
  );
}
