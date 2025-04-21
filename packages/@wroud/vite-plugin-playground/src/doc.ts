import { getDescribe } from "./describe.js";
import { registerDoc } from "./registry/docs.js";

export function doc<T>(
  name: string,
  component: React.ComponentType<T>,
  props?: T,
) {
  const describe = getDescribe();
  const id =
    describe.id !== "/" ? describe.id + "/" + name : describe.id + name;

  return registerDoc({ id, name, describe, component, props });
}
