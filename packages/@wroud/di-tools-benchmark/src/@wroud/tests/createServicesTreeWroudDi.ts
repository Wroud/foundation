import type { IServiceConstructor, SingleServiceType } from "@wroud/di/types";
import {
  createServicesTree,
  type IServicePair,
} from "../../tools/createServicesTree.js";
import { createService, injectable, single } from "@wroud/di";

export type ServicePair = IServicePair<
  SingleServiceType<any>,
  IServiceConstructor<any>
>;
export function createServicesTreeWroudDi(
  deep: number,
  level: number,
  services: ServicePair[],
): ServicePair | undefined {
  return createServicesTree(
    deep,
    level,
    services,
    (i) => createService(`service${i}`),
    (i, deps) => {
      @injectable(() => deps.map(single))
      class Impl {
        constructor(...service: any[]) {}
      }

      return Impl;
    },
  );
}
