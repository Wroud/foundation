import { ServiceCollection } from "./ServiceCollection.js";
import { describe, expect, it } from "vitest";
import { ServiceRegistry } from "./ServiceRegistry.js";
import "../debugDevelopment.js";

describe("ServiceCollection development", () => {
  it("should detect cyclic dependencies", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [Test2],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [Test1],
    });

    const collection = new ServiceCollection();
    collection.addScoped(Test1);
    expect(() => collection.addScoped(Test2)).toThrowError(
      "Cyclic dependency detected: Test2 -> Test1 -> Test2",
    );
  });
  it("should detect cyclic dependencies to itself", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [Test2],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [Test1],
    });

    const collection = new ServiceCollection();
    expect(() => collection.addScoped(Test1, Test2)).toThrowError(
      "Cyclic dependency detected: Test2 (Test1) -> Test2 (Test1)",
    );
  });
});
