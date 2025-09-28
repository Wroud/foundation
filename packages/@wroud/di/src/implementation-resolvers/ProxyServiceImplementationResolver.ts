import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type { IResolverServiceType } from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ProxyServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.service);
  }

  constructor(private readonly service: IResolverServiceType<any, T>) {
    super({
      dependencies: [service],
      create: ([implementation]) => implementation as T,
    });
  }
}
