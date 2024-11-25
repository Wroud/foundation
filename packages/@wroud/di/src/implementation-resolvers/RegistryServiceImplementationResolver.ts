import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceConstructor,
  IServiceDescriptor,
  IServiceImplementationResolver,
  SingleServiceImplementation,
  IServiceTypeResolver,
  RequestPath,
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
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
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
        requestedPath,
        mode,
      )) as T | SingleServiceImplementation<T>;
    }

    const metadata = ServiceRegistry.get(implementation);

    if (metadata) {
      if (metadata.dependencies.length > 0) {
        const instanceDependencies: any[] = [];

        requestedPath = {
          value: descriptor,
          next: requestedPath,
        };
        for (const dependency of metadata.dependencies) {
          instanceDependencies.push(
            yield* internalGetService(
              dependency,
              descriptor,
              requestedPath,
              mode,
            ),
          );
        }
        return () =>
          new (implementation as IServiceConstructor<T>)(
            ...instanceDependencies,
          );
      }

      return () => new (implementation as IServiceConstructor<T>)();
    }

    return yield* new FactoryServiceImplementationResolver(
      implementation,
    ).resolve(internalGetService, descriptor, requestedBy, requestedPath, mode);
  }
}
