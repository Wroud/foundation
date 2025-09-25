import { all } from "../../service-type-resolvers/all.js";
import type {
  ServiceType,
  IResolverServiceType,
  SingleServiceType,
} from "../../types/index.js";

export type ServicesCompatible = (
  | ServiceType<any>
  | [SingleServiceType<any, any>]
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
): ServiceType<any>[] {
  return dependencies.map(mapDependency);
}

function mapDependency(dependency: ServicesCompatible[0]) {
  if (Array.isArray(dependency)) {
    return all(dependency[0]);
  }
  return dependency;
}
