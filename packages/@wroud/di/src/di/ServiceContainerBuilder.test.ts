import { expect, it, describe } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { lazy } from "../implementation-resolvers/lazy.js";
import { single } from "../service-type-resolvers/single.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { createAsyncMockedService } from "../tests/createAsyncMockedService.js";
import { createService } from "./createService.js";

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
  it("validate should have no side effects", async () => {
    const Test1 = createSyncMockedService("Test1", () => []);
    const Test2 = createSyncMockedService("Test2", () => []);
    const Test3 = createSyncMockedService("Test3", () => []);

    const builder = new ServiceContainerBuilder();
    builder.addSingleton(Test1).addScoped(Test2).addTransient(Test3);

    await builder.validate();

    for (const descriptor of builder) {
      expect(descriptor.dry).not.toBeDefined();
    }
    expect(Test1.constructorMock).not.toHaveBeenCalled();
    expect(Test2.constructorMock).not.toHaveBeenCalled();
    expect(Test3.constructorMock).not.toHaveBeenCalled();
  });
});
