import { expect, it, describe } from "@jest/globals";
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
});
