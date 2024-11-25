///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { lazy } from "../implementation-resolvers/lazy.js";
import { createService } from "./createService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import "../debugDevelopment.js";

describe("ServiceProvider", () => {
  it("should throw on attempt to resolve async service implementation with circular dependency", async () => {
    const serviceB = createService("B");
    const A = createSyncMockedService("A", () => [serviceB]);
    const loaderA = lazy(() => Promise.resolve(A));
    const B = createSyncMockedService("B", () => [A]);
    const loaderB = lazy(() => Promise.resolve(B));

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(A, loaderA)
      .addSingleton(serviceB, loaderB)
      .build();

    await expect(() => serviceProvider.getServiceAsync(A)).rejects.toThrowError(
      "Cyclic dependency detected: A -> B -> A",
    );
  });
  it("should throw on attempt to resolve async service implementation with circular dependency with multiple services resolve", async () => {
    const serviceB = createService("B");
    const A = createSyncMockedService("A", () => [[serviceB]]);
    const loaderA = lazy(() => Promise.resolve(A));

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(serviceB, loaderA)
      .build();

    await expect(() =>
      serviceProvider.getServicesAsync(serviceB),
    ).rejects.toThrowError("Cyclic dependency detected: A (B) -> A (B)");
  });
});
