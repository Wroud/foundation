import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
  RequestPath,
} from "../types/index.js";

export abstract class BaseServiceImplementationResolver<T>
  implements IServiceImplementationResolver<T>
{
  abstract get name(): string;
  abstract resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown>;
}

export function isServiceImplementationResolver<T>(
  value: unknown,
): value is IServiceImplementationResolver<T> {
  return value instanceof BaseServiceImplementationResolver;
}
