import { describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "./ModuleRegistry.js";
import type { IModule } from "./IModule.js";

describe("ModuleRegistry", () => {
  it("should be defined", () => {
    expect(ModuleRegistry).toBeDefined();
  });
  it("should have add method", () => {
    expect(ModuleRegistry).toHaveProperty("add");
  });
  it("should have get method", () => {
    expect(ModuleRegistry).toHaveProperty("get");
  });
  it("should have addListener method", () => {
    expect(ModuleRegistry).toHaveProperty("addListener");
  });
  it("should have has method", () => {
    expect(ModuleRegistry).toHaveProperty("has");
  });
  it("should have Symbol.iterator method", () => {
    expect(Symbol.iterator in ModuleRegistry).toBeTruthy();
  });
  it("should iterate over modules", () => {
    const module = createModule("test-0");
    ModuleRegistry.add(module);
    expect([...ModuleRegistry]).toContain(module);
  });
  it("should add module", () => {
    const module = createModule("test");
    ModuleRegistry.add(module);
    expect(ModuleRegistry.get(module.name)).toBe(module);
  });
  it("should not add duplicate module", () => {
    const module = createModule("test-1");
    ModuleRegistry.add(module);
    expect(() => ModuleRegistry.add(createModule("test-1"))).toThrowError(
      `Module ${module.name} is already added.`,
    );
  });
  it("should add listener", () => {
    const listener = vi.fn();
    ModuleRegistry.addListener(listener);
    ModuleRegistry.add(createModule("test-2"));
    expect(listener).toBeCalled();
  });
});

function createModule(name: string): IModule {
  return {
    name,
    configure(serviceCollection) {
      return Promise.resolve();
    },
  };
}
