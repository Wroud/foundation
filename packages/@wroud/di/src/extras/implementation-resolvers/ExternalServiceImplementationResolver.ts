import { EMPTY_DEPS } from "../../helpers/EMPTY_DEPS.js";
import { BaseServiceImplementationResolver } from "../../implementation-resolvers/BaseServiceImplementationResolver.js";
import type {
  IResolvedServiceImplementation,
  IServiceDescriptor,
  IServiceTypeResolver,
  RequestPath,
  SingleServiceType,
} from "../../types/index.js";
import { CONTEXT_EXTERNAL_SERVICES_KEY } from "../service-type-resolvers/ExternalServiceTypeResolver.js";

export class ExternalServiceImplementationResolver<
  T,
> extends BaseServiceImplementationResolver<T> {
  get name(): string {
    return "external()";
  }

  *resolve(
    internalGetService: IServiceTypeResolver,
    descriptor: IServiceDescriptor<any>,
    requestedBy: IServiceDescriptor<any> | null,
    requestedPath: RequestPath,
    mode: "sync" | "async",
    context: Readonly<Record<string | symbol, unknown>>,
  ): Generator<Promise<unknown>, IResolvedServiceImplementation<T>, unknown> {
    const implementation = (
      context[CONTEXT_EXTERNAL_SERVICES_KEY] as
        | Map<SingleServiceType<unknown>, unknown>
        | undefined
    )?.get(descriptor.service);
    if (implementation === undefined) {
      throw new Error(`No external implementation found.`);
    }

    return {
      dependencies: EMPTY_DEPS,
      create: () => implementation as T,
    };
  }
}

export function isExternalServiceImplementationResolver<T>(
  value: any,
): value is ExternalServiceImplementationResolver<T> {
  return value instanceof ExternalServiceImplementationResolver;
}
