import { expect, it, describe } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";

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
  it("validate should have no side effects", async () => {
    const Test1 = createSyncMockedService("Test1", () => []);
    const Test2 = createSyncMockedService("Test2", () => []);
    const Test3 = createSyncMockedService("Test3", () => []);

    const builder = new ServiceContainerBuilder();
    builder.addSingleton(Test1).addScoped(Test2).addTransient(Test3);

    await builder.validate();

    expect(Test1.constructorMock).not.toHaveBeenCalled();
    expect(Test2.constructorMock).not.toHaveBeenCalled();
    expect(Test3.constructorMock).not.toHaveBeenCalled();
  });
});
