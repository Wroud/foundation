import { describe, expect, it, jest } from "@jest/globals";

jest.unstable_mockModule("./ServicesRegistry.js", () => ({
  ServicesRegistry: {
    register: jest.fn(),
    has: jest.fn(),
    get: jest.fn(),
  },
}));

const { injectable } = await import("./injectable.js");
const { ServicesRegistry } = await import("./ServicesRegistry.js");

describe("injectable", () => {
  it("should be defined", () => {
    expect(injectable).toBeDefined();
  });
  it("should register service", () => {
    @injectable()
    class Test {}
    expect(ServicesRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [],
    });
  });
  it("should register service with dependencies", () => {
    class Dep {}
    @injectable(() => [Dep])
    class Test {}
    expect(ServicesRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [Dep],
    });
  });
  it("should register service with ts legacy decorator", () => {
    class Test {}
    injectable()(Test);
    expect(ServicesRegistry.register).toBeCalledWith(Test, {
      name: "Test",
      dependencies: [],
    });
  });
});
