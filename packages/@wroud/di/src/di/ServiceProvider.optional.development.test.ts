///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { optional } from "../service-type-resolvers/optional.js";
import "../debugDevelopment.js";

describe("ServiceProvider development", () => {
  it("should not resolve from constructor", () => {
    const AService = createService<InstanceType<typeof A>>("A");
    const BService = createService<InstanceType<typeof B>>("B");

    const A = createSyncMockedService("A", () => []);
    const B = createSyncMockedService(
      "B",
      () => [optional(AService)],
      (a) => {
        a.resolve();
      },
    );

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, B)
      .build();

    expect(() => serviceProvider.getService(BService)).toThrowError(
      "Optional service A cannot be resolved during construction of service B. Please convert it to a regular dependency.",
    );
  });
});
