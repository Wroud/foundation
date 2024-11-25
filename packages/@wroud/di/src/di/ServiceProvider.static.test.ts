///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceProvider } from "./ServiceProvider.js";
import { createService } from "./createService.js";
import { single } from "../service-type-resolvers/single.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";

describe("ServiceProvider", () => {
  it("should should check for instance in static internalGetService", () => {
    expect(() =>
      ServiceProvider.internalGetService(
        {} as any,
        single(createService("test")),
        null,
        { value: null, next: null },
        "sync",
      ),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
  it("should should check for instance in static getDescriptor", () => {
    expect(() =>
      ServiceProvider.getDescriptor({} as any, createService("test")),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
  it("should should check for instance in static getDescriptors", () => {
    expect(() =>
      ServiceProvider.getDescriptors({} as any, createService("test")),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
  it("should return descriptor for service", () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B");
    const S = createService("S");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(S, A)
      .addSingleton(S, B)
      .build();

    expect(ServiceProvider.getDescriptor(serviceProvider, S)).toBeDefined();
    expect(ServiceProvider.getDescriptors(serviceProvider, S)).toHaveLength(2);
  });
});
