import { vi } from "vitest";
import { injectable } from "../di/injectable.js";

export function createAsyncMockedService(
  name: string,
  deps: () => any[] = () => [],
) {
  @injectable(deps)
  class Disposable {
    readonly deps: any[];
    constructor(...deps: any[]) {
      this.deps = deps;
    }
    [Symbol.asyncDispose] = vi.fn();
  }
  Object.defineProperty(Disposable, "name", { value: name });
  return Disposable;
}
