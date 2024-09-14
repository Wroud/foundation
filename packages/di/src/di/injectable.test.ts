import { beforeEach, describe, expect, it, vi } from "vitest";
import { injectable } from "./injectable.js";
import { ServiceRegistry } from "./ServiceRegistry.js";

vi.mock(import("./ServiceRegistry.js"), () => ({
  ServiceRegistry: {
    register: vi.fn(),
    has: vi.fn(),
    get: vi.fn(),
  } as any,
}));

beforeEach(() => {
  vi.resetAllMocks();
});

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
  it("should register service with ts legacy decorator and context", () => {
    class Test {}
    injectable()(Test, {} as any);
    expect(ServiceRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [],
    });
  });
});
