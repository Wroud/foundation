import type { MapToServicesType } from "./MapToServicesType.js";
import { ServicesRegistry } from "./ServicesRegistry.js";

export function injectable<TServices extends any[] = []>(
  dependencies: () => [...TServices] = () => [] as any,
) {
  return <
    TClass extends abstract new (
      ...args: MapToServicesType<TServices>
    ) => any | Function,
  >(
    target: TClass,
    context?: ClassDecoratorContext<TClass> | undefined,
    ...rest: any[]
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
    ServicesRegistry.register(target, {
      name,
      dependencies: dependencies(),
    });

    return target;
  };
}
