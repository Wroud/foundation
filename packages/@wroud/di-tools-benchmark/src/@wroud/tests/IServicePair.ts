import type { IServiceConstructor, SingleServiceType } from "@wroud/di/types";

export interface IServicePair {
  service: SingleServiceType<any>;
  impl: IServiceConstructor<any>;
}
