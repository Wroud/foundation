import {
  createServicesTree,
  type IServicePair,
} from "../../tools/createServicesTree.js";
import { injected, token, type Token } from "brandi";

export type ServicePair = IServicePair<
  Token<unknown>,
  new (...args: any[]) => any
>;
export function createServicesTreeBrandi(
  deep: number,
  level: number,
  services: ServicePair[],
): ServicePair | undefined {
  return createServicesTree(
    deep,
    level,
    services,
    (i) => token(`service${i}`),
    (i, deps) => {
      class Impl {
        constructor(...service: any[]) {}
      }
      injected(Impl, ...(deps as any));

      return Impl;
    },
  );
}
