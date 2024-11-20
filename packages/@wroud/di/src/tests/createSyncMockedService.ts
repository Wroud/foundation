import { vi } from "vitest";
import { injectable } from "../di/injectable.js";

export function createSyncMockedService(
  name: string,
  deps: () => any[] = () => [],
  constructorImplementation?: (...deps: any[]) => void,
) {
  const constructorMock = vi.fn(constructorImplementation);
  @injectable(deps)
  class Disposable {
    readonly deps: any[];
    // issue with v8-coverage https://github.com/vitest-dev/vitest/issues/5329
    declare static constructorMock: typeof constructorMock;
    constructor(...deps: any[]) {
      this.deps = deps;
      constructorMock(...deps);
    }
    [Symbol.dispose] = vi.fn();
  }
  Disposable.constructorMock = constructorMock;

  Object.defineProperty(Disposable, "name", { value: name });
  return Disposable;
}
