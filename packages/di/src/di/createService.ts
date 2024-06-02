import type { IServiceConstructor } from "./IServiceConstructor.js";

export function createService<T>(name: string): IServiceConstructor<T> {
  const obj = {
    [name]() {
      throw new Error(`Service type ${name} can't be initiated`);
    },
  };
  return obj[name] as unknown as IServiceConstructor<T>;
}
