import {
  mapDependenciesCompatible,
  type ServicesCompatible,
} from "../compatible-layer/zero/mapDependenciesCompatible.js";
import type { MapToServicesType } from "../types/index.js";
import type { IBaseServiceResolutions } from "./IBaseServiceResolutions.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { all } from "../service-type-resolvers/all.js";
import { optional } from "../service-type-resolvers/optional.js";
import { single } from "../service-type-resolvers/single.js";

function injectable(): <
  TClass extends abstract new (...args: MapToServicesType<[]>) => any,
>(
  target: TClass,
  context?: ClassDecoratorContext<TClass> | undefined,
) => TClass;
function injectable<TServices extends ServicesCompatible>(
  dependencies: (resolutions: IBaseServiceResolutions) => [...TServices],
): <TClass extends abstract new (...args: MapToServicesType<TServices>) => any>(
  target: TClass,
  context?: ClassDecoratorContext<TClass> | undefined,
) => TClass;
function injectable<TServices extends ServicesCompatible>(
  dependencies: (resolutions: IBaseServiceResolutions) => [...TServices],
): <TClass extends new (...args: MapToServicesType<TServices>) => any>(
  target: TClass,
) => TClass;
function injectable<TServices extends ServicesCompatible>(
  dependencies: (resolutions: IBaseServiceResolutions) => [...TServices] = () =>
    [] as any,
) {
  return <
    TClass extends abstract new (...args: MapToServicesType<TServices>) => any,
  >(
    target: TClass,
    context?: ClassDecoratorContext<TClass> | undefined,
  ): TClass => {
    let name = target.name;

    // context is undefined for legacy decorators (stage 2)
    if (context !== undefined) {
      name = context.name ?? name;
    }

    Object.defineProperty(target, "name", {
      value: name,
      writable: false,
    });
    ServiceRegistry.register(target, {
      name,
      dependencies: mapDependenciesCompatible(
        dependencies({ all, optional, single }),
      ),
    });

    return target;
  };
}

export { injectable };
