import type {
  GetServiceTypeImplementation,
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceImplementationResolver,
  IServiceTypeResolver,
  RequestPath,
  ServiceType,
  SingleServiceImplementation,
} from "../../types/index.js";
import { BaseServiceImplementationResolver } from "../../implementation-resolvers/BaseServiceImplementationResolver.js";
import { fallback } from "../../implementation-resolvers/fallback.js";

export interface IConditionFactory<T, TArgs extends ServiceType<unknown>[]> {
  (
    ...args: GetServiceTypeImplementation<TArgs>
  ):
    | T
    | SingleServiceImplementation<T>
    | IServiceImplementationResolver<T>
    | Promise<
        SingleServiceImplementation<T> | IServiceImplementationResolver<T>
      >;
}

export class ConditionalServiceImplementationResolver<
  T,
  TArgs extends ServiceType<unknown>[],
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return "conditional(?)";
  }

  constructor(
    private readonly factory: IConditionFactory<T, TArgs>,
    private readonly dependencies: TArgs,
  ) {
    super();
  }

  override *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<T>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    const deps: unknown[] = [];
    for (const dep of this.dependencies) {
      deps.push(
        yield* internalGetService(
          dep,
          requestedBy,
          requestedPath,
          mode,
          context,
        ),
      );
    }
    const result = this.factory(
      ...(deps as GetServiceTypeImplementation<TArgs>),
    );
    let implementation:
      | T
      | SingleServiceImplementation<T>
      | IServiceImplementationResolver<T>;

    if (result instanceof Promise) {
      yield result.then((impl) => {
        implementation = impl;
      });
    } else {
      implementation = result;
    }

    implementation = fallback(implementation!);

    return yield* implementation.resolve(
      internalGetService,
      descriptor,
      requestedBy,
      requestedPath,
      mode,
      context,
    );
  }
}

export function isConditionalServiceImplementationResolver<
  T,
  TArgs extends ServiceType<unknown>[],
>(value: any): value is ConditionalServiceImplementationResolver<T, TArgs> {
  return value instanceof ConditionalServiceImplementationResolver;
}
