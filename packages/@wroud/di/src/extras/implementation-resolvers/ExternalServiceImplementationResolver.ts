import { ServiceLifetime } from "../../di/ServiceLifetime.js";
import { EMPTY_DEPS } from "../../helpers/EMPTY_DEPS.js";
import { getNameOfServiceType } from "../../helpers/getNameOfServiceType.js";
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
    if (descriptor.lifetime !== ServiceLifetime.Transient) {
      throw new Error(
        `The external() resolver only supports Transient services, but the service ${getNameOfServiceType(descriptor.service)} has lifetime ${ServiceLifetime[descriptor.lifetime]}.`,
      );
    }
    const implementation = (
      context[CONTEXT_EXTERNAL_SERVICES_KEY] as
        | Map<SingleServiceType<unknown>, unknown>
        | undefined
    )?.get(descriptor.service);
    if (implementation === undefined) {
      throw new Error(
        `No external implementation found for service ${getNameOfServiceType(descriptor.service)}`,
      );
    }

    return {
      dependencies: EMPTY_DEPS,
      create: () => implementation as T,
    };
  }
}
