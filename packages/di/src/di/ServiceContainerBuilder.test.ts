import { expect, it, describe } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { ServiceCollection } from "./ServiceCollection.js";

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
});
