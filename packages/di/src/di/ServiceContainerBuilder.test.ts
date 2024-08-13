import { expect, it, describe } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { lazy } from "./lazy.js";

describe("ServiceContainerBuilder", () => {
  it("should be defined", () => {
    expect(new ServiceContainerBuilder()).toBeDefined();
  });
  it("should have build method", () => {
    expect(new ServiceContainerBuilder()).toHaveProperty("build");
  });
  it("should have addSingleton method", () => {
    expect(new ServiceContainerBuilder()).toBeInstanceOf(ServiceCollection);
  });
  it("should should not mutate created service providers", () => {
    const builder = new ServiceContainerBuilder();
    const provider = builder.build();
    builder.addSingleton(String, "Hello");
    expect(() => provider.getService(String)).toThrowError(
      'No service of type "String" is registered',
    );
  });
  it("should detect async cyclic dependencies", async () => {
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

    const builder = new ServiceContainerBuilder();
    builder
      .addScoped(
        Test1,
        lazy(() => Promise.resolve(Test1)),
      )
      .addScoped(
        Test2,
        lazy(() => Promise.resolve(Test2)),
      );

    await expect(() => builder.validate()).rejects.toThrowError(
      "Cyclic dependency detected: Test1 -> Test2 -> Test1",
    );
  });
});
