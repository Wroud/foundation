import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceImplementationResolver,
  SingleServiceImplementation,
  IServiceTypeResolver,
} from "../types/index.js";
import {
  BaseServiceImplementationResolver,
  isServiceImplementationResolver,
} from "./BaseServiceImplementationResolver.js";
import { ServiceRegistry } from "../di/ServiceRegistry.js";
import { FactoryServiceImplementationResolver } from "./FactoryServiceImplementationResolver.js";

export class RegistryServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return getNameOfServiceType(this.implementation);
  }

  constructor(
    private readonly implementation:
      | T
      | SingleServiceImplementation<T>
      | IServiceImplementationResolver<T | SingleServiceImplementation<T>>,
  ) {
    super();
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<T>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    let implementation = this.implementation;

    if (
      isServiceImplementationResolver<T | SingleServiceImplementation<T>>(
        implementation,
      )
    ) {
      implementation = (yield* implementation.resolve(
        internalGetService,
        descriptor,
        requestedBy,
        mode,
      )) as T | SingleServiceImplementation<T>;
    }

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      const instanceDependencies: any[] = [];
      requestedBy = new Set([...requestedBy, descriptor]);
      for (const dependency of metadata.dependencies) {
        instanceDependencies.push(
          yield* internalGetService(dependency, requestedBy, mode),
        );
      }

      return () =>
        new (implementation as IServiceConstructor<T>)(...instanceDependencies);
    }

    return yield* new FactoryServiceImplementationResolver(
      implementation,
    ).resolve(internalGetService, descriptor, requestedBy, mode);
  }
}
