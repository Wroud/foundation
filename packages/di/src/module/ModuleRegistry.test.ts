import { describe, expect, it, jest } from "@jest/globals";
import { ModuleRegistry } from "./ModuleRegistry.js";
import type { IModule } from "./IModule.js";

describe("ModuleRegistry", () => {
  it("should be defined", () => {
    expect(ModuleRegistry).toBeDefined();
  });
  it("should have register method", () => {
    expect(ModuleRegistry).toHaveProperty("register");
  });
  it("should have getModules method", () => {
    expect(ModuleRegistry).toHaveProperty("getModules");
  });
  it("should have addListener method", () => {
    expect(ModuleRegistry).toHaveProperty("addListener");
  });
  it("should register module", () => {
    const module = createModule("test");
    ModuleRegistry.register(module);
    expect(ModuleRegistry.getModules()).toContain(module);
  });
  it("should not register duplicate module", () => {
    const module = createModule("test-1");
    ModuleRegistry.register(module);
    expect(() => ModuleRegistry.register(createModule("test-1"))).toThrowError(
      `Module ${module.name} is already registered.`,
    );
  });
  it("should add listener", () => {
    const listener = jest.fn();
    ModuleRegistry.addListener(listener);
    ModuleRegistry.register(createModule("test-2"));
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
