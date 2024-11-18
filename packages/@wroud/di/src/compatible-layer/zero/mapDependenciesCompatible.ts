import { all } from "../../service-type-resolvers/all.js";
import { single } from "../../service-type-resolvers/single.js";
import { isServiceTypeResolver } from "../../service-type-resolvers/BaseServiceTypeResolver.js";
import type {
  ServiceType,
  IResolverServiceType,
  SingleServiceType,
} from "../../types/index.js";

export type ServicesCompatible = (
  | ServiceType<any>
  | [SingleServiceType<any>]
)[];

type RemapOldType<T extends ServicesCompatible[0]> =
  T extends IResolverServiceType<any, any>
    ? T
    : T extends [...infer P]
      ? IResolverServiceType<any, P>
      : IResolverServiceType<any, T>;

export type MapServicesCompatible<T extends ServicesCompatible> = {
  [K in keyof T]: RemapOldType<T[K]>;
};

export function mapDependenciesCompatible(
  dependencies: ServicesCompatible,
): IResolverServiceType<any, any>[] {
  return dependencies.map((dependency) => {
    if (isServiceTypeResolver(dependency)) {
      return dependency;
    }

    if (Array.isArray(dependency)) {
      return all(dependency[0]);
    }
    return single(dependency);
  });
}
