import type { IAbstractServiceConstructor } from "./IAbstractServiceConstructor.js";
import type { IServiceConstructor } from "./IServiceConstructor.js";
import type { IServiceFactory } from "./IServiceFactory.js";
import { ServicesRegistry } from "./ServicesRegistry.js";

type UnpackServiceType<T> = T extends
  | IServiceConstructor<any>
  | IAbstractServiceConstructor<any>
  ? InstanceType<T>
  : T extends IServiceFactory<any>
    ? ReturnType<T>
    : T;

type MapToServices<TServices extends any[]> = {
  [K in keyof TServices]: TServices[K] extends [...infer P]
    ? { [K in keyof P]: UnpackServiceType<P[K]> }
    : UnpackServiceType<TServices[K]>;
};

export function injectable<TServices extends any[] = []>(
  dependencies: () => [...TServices] = () => [] as any,
) {
  return <
    TClass extends abstract new (...args: MapToServices<TServices>) => any,
  >(
    target: TClass,
    context: ClassDecoratorContext<TClass> | undefined,
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
