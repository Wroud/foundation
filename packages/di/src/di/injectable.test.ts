import { describe, expect, it, vi } from "vitest";

vi.mock("./ServiceRegistry.js", () => ({
  ServiceRegistry: {
    register: vi.fn(),
    has: vi.fn(),
    get: vi.fn(),
  },
}));

const { injectable } = await import("./injectable.js");
const { ServiceRegistry } = await import("./ServiceRegistry.js");

describe("injectable", () => {
  it("should be defined", () => {
    expect(injectable).toBeDefined();
  });
  it("should register service", () => {
    @injectable()
    class Test {}
    expect(ServiceRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [],
    });
  });
  it("should register service with dependencies", () => {
    class Dep {}
    @injectable(() => [Dep])
    class Test {}
    expect(ServiceRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [Dep],
    });
  });
  it("should register service with ts legacy decorator", () => {
    class Test {}
    injectable()(Test);
    expect(ServiceRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [],
    });
  });
});
