import type { MapToServicesType, ServiceType } from "../types/index.js";
import { ServiceRegistry } from "./ServiceRegistry.js";

function injectable(): <
  TClass extends abstract new (...args: MapToServicesType<[]>) => any,
>(
  target: TClass,
  context?: ClassDecoratorContext<TClass> | undefined,
) => TClass;
function injectable<TServices extends ServiceType<any>[]>(
  dependencies: () => [...TServices],
): <TClass extends abstract new (...args: MapToServicesType<TServices>) => any>(
  target: TClass,
  context?: ClassDecoratorContext<TClass> | undefined,
) => TClass;
function injectable<TServices extends ServiceType<any>[]>(
  dependencies: () => [...TServices],
): <TClass extends new (...args: MapToServicesType<TServices>) => any>(
  target: TClass,
) => TClass;
function injectable<TServices extends ServiceType<any>[]>(
  dependencies: () => [...TServices] = () => [] as any,
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
      dependencies: dependencies(),
    });

    return target;
  };
}

export { injectable };
