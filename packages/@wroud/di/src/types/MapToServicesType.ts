import type { IAbstractServiceConstructor } from "./IAbstractServiceConstructor.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import type { IResolverServiceType } from "./IResolverServiceType.js";

type UnpackServiceType<T> = T extends
  | IServiceConstructor<any>
  | IAbstractServiceConstructor<any>
  ? InstanceType<T>
  : T extends IServiceFactory<any>
    ? ReturnType<T>
    : T;

export type MapToServicesType<TServices extends any[]> = {
  [K in keyof TServices]: TServices[K] extends IResolverServiceType<
    any,
    infer P
  >
    ? UnpackServiceType<P>
    : TServices[K] extends [...infer P]
      ? { [K in keyof P]: UnpackServiceType<P[K]> }
      : UnpackServiceType<TServices[K]>;
};
