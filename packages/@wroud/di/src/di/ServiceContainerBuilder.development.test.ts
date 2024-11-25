import { describe, expect, it, vi } from "vitest";
import { ServiceRegistry } from "./ServiceRegistry.js";
import "../debugDevelopment.js";
import { single } from "../service-type-resolvers/single.js";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { lazy } from "../implementation-resolvers/lazy.js";
import { createService } from "./createService.js";
import { createAsyncMockedService } from "../tests/createAsyncMockedService.js";

describe("ServiceContainerBuilder development", () => {
  it("should warn async services not validated", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [single(Test2)],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [single(Test1)],
    });

    const builder = new ServiceContainerBuilder();
    builder.addScoped(
      Test1,
      lazy(() => Promise.resolve(Test1)),
    );
    builder.addScoped(
      Test2,
      lazy(() => Promise.resolve(Test2)),
    );

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => builder.build()).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      'Service implementation for "Test1" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
    expect(warn).toHaveBeenCalledWith(
      'Service implementation for "Test2" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
    warn.mockRestore();
  });
  it("should detect cyclic dependencies", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [single(Test2)],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [single(Test1)],
    });

    const builder = new ServiceContainerBuilder();
    builder.addScoped(Test1);
    builder.addScoped(Test2);
    expect(() => builder.build()).toThrowError(
      "Cyclic dependency detected: Test1 -> Test2 -> Test1",
    );
  });
  it("should detect cyclic dependencies to itself", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [single(Test2)],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [single(Test1)],
    });

    const builder = new ServiceContainerBuilder();
    builder.addScoped(Test1, Test2).addScoped(
      Test2,
      lazy(() => Promise.resolve(Test2)),
    );
    expect(() => builder.build()).toThrowError(
      "Cyclic dependency detected: Test2 (Test1) -> Test2 (Test1)",
    );
  });
  it("should detect async cyclic dependencies", async () => {
    const Test1Service = createService("Test1");
    const Test2Service = createService("Test2");

    const Test1 = createAsyncMockedService("Test1", () => [
      single(Test2Service),
    ]);
    const Test2 = createAsyncMockedService("Test2", () => [
      single(Test1Service),
    ]);
    const Test3 = createAsyncMockedService("Test3", () => []);
    const Test4 = createAsyncMockedService("Test4", () => []);

    const builder = new ServiceContainerBuilder();
    builder
      .addSingleton(Test3)
      .addTransient(Test4)
      .addScoped(
        Test1Service,
        lazy(() => Promise.resolve(Test1)),
      )
      .addScoped(
        Test2Service,
        lazy(() => Promise.resolve(Test2)),
      );

    await expect(() => builder.validate()).rejects.toThrowError(
      "Cyclic dependency detected: Test1 -> Test2 -> Test1",
    );

    expect(Test1.constructorMock).not.toHaveBeenCalled();
    expect(Test2.constructorMock).not.toHaveBeenCalled();
    expect(Test3.constructorMock).not.toHaveBeenCalled();
    expect(Test4.constructorMock).not.toHaveBeenCalled();
  });
});
