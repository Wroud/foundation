import { describe, expect, it } from "@jest/globals";
import { ServicesRegistry } from "./ServicesRegistry.js";

describe("ServicesRegistry", () => {
  it("should be defined", () => {
    expect(ServicesRegistry).toBeDefined();
  });
  it("should have get method", () => {
    expect(ServicesRegistry).toHaveProperty("get");
  });
  it("should have has method", () => {
    expect(ServicesRegistry).toHaveProperty("has");
  });
  it("should have register method", () => {
    expect(ServicesRegistry).toHaveProperty("register");
  });
  it("should register service", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(ServicesRegistry.has(Test)).toBe(true);
  });
  it("should get service", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(ServicesRegistry.get(Test)).toEqual({
      name: "Test",
      dependencies: [],
    });
  });
  it("should not have service", () => {
    class Test {}
    expect(ServicesRegistry.has(Test)).toBe(false);
  });
  it("should not get service", () => {
    class Test {}
    expect(ServicesRegistry.get(Test)).toBeUndefined();
  });
  it("should throw on duplicate registration", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(() =>
      ServicesRegistry.register(Test, { name: "Test", dependencies: [] }),
    ).toThrowError("Service Test is already registered");
  });
  it("should be empty after GC", () => {
    if (global.gc) {
      global.gc();
    }
    const afterCreationMemoryUsage = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      ServicesRegistry.register(
        new (class {
          fields = Array.from({ length: 1000 }).fill(
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          );
        })(),
        { name: "Test", dependencies: [] },
      );
    }

    if (global.gc) {
      global.gc();
    }

    expect(
      Math.abs(afterCreationMemoryUsage - process.memoryUsage().heapUsed),
    ).toBeLessThan(100000); // this test can fail if any other tests throw an error
  });
});
