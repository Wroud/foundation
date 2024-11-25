import { injectable } from "@wroud/di";

export function createSyncMockedService(
  name: string,
  deps: () => any[] = () => [],
  constructorImplementation?: (...deps: any[]) => void,
) {
  @injectable(deps)
  class Disposable {
    readonly deps: any[];
    constructor(...deps: any[]) {
      this.deps = deps;
      constructorImplementation?.(...deps);
    }
  }

  Object.defineProperty(Disposable, "name", { value: name });
  return Disposable;
}
