import { getNameOfServiceType } from "../helpers/getNameOfServiceType.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceFactory,
  IServiceImplementationResolver,
  SingleServiceImplementation,
  IServiceTypeResolver,
  RequestPath,
} from "../types/index.js";
import {
  BaseServiceImplementationResolver,
  isServiceImplementationResolver,
} from "./BaseServiceImplementationResolver.js";
import { Debug } from "../debug.js";
import { ValueServiceImplementationResolver } from "./ValueServiceImplementationResolver.js";
import { IServiceProvider } from "../di/IServiceProvider.js";

const FactoryDeps = [IServiceProvider];

export class FactoryServiceImplementationResolver<
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
    getService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
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
        getService,
        descriptor,
        requestedBy,
        requestedPath,
        mode,
      )).implementation;
    }

    if (typeof implementation === "function") {
      return {
        implementation: implementation as T,
        dependencies: FactoryDeps,
        create: ([serviceProvider]) => {
          try {
            return (implementation as IServiceFactory<T>)(serviceProvider);
          } catch (err) {
            if (
              err instanceof TypeError &&
              err.message.includes("cannot be invoked without 'new'")
            ) {
              throw new Error(
                Debug.errors.classNotDecorated(implementation.name),
                {
                  cause: err,
                },
              );
            } else {
              throw err;
            }
          }
        },
      };
    }

    return yield* new ValueServiceImplementationResolver(
      implementation,
    ).resolve(getService, descriptor, requestedBy, requestedPath, mode);
  }
}
