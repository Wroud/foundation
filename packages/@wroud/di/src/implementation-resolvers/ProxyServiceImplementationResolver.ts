import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IResolverServiceType,
} from "../types/index.js";
import { BaseServiceImplementationResolver } from "./BaseServiceImplementationResolver.js";

export class ProxyServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.service);
  }

  private readonly resolved: IResolvedServiceImplementation<T>;
  constructor(private readonly service: IResolverServiceType<any, T>) {
    super();
    this.resolved = {
      dependencies: [this.service],
      create: ([implementation]) => implementation as T,
    };
  }

  *resolve(): Generator<
    Promise<unknown>,
    IResolvedServiceImplementation<T>,
    unknown
  > {
    return this.resolved;
  }
}
