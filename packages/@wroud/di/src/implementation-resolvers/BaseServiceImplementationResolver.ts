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

  /**
   * Cached resolved service implementation.
   *
   * **Important**: Only set this property if the resolved implementation is static
   * and will never change between calls. If the implementation might return different
   * values on subsequent calls (e.g., factories, dynamic resolution), leave this as
   * `null` and override the `resolve` method instead.
   */
  resolved: IResolvedServiceImplementation<T> | null;

  /**
   * Creates a new service implementation resolver.
   *
   * @param resolved - Initial resolved service implementation. Only provide this if the
   * implementation is static and will never change. For dynamic implementations, pass
   * `null` (default) and override the `resolve` method instead.
   */
  constructor(resolved: IResolvedServiceImplementation<T> | null = null) {
    this.resolved = resolved;
  }
  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    if (this.resolved === null) {
      throw new Error(
        `Service implementation resolver "${this.name}" is not initialized.`,
      );
    }
    return this.resolved;
  }
}

export function isServiceImplementationResolver<T>(
  value: unknown,
): value is IServiceImplementationResolver<T> {
  return value instanceof BaseServiceImplementationResolver;
}
