import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
} from "../types/index.js";

export abstract class BaseServiceImplementationResolver<T>
  implements IServiceImplementationResolver<T>
{
  abstract get name(): string;
  abstract resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: Set<IServiceDescriptor<any>>,
    mode: "sync" | "async",
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown>;
}

export function isServiceImplementationResolver<T>(
  value: unknown,
): value is IServiceImplementationResolver<T> {
  return value instanceof BaseServiceImplementationResolver;
}
