///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import "../debugDevelopment.js";

describe("ServiceProvider development", () => {
  it("should not resolve class service that not registered in ServiceRegistry", () => {
    class Test {}
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      'Class "Test" not registered as service (please use @injectable or ServiceRegistry)',
    );
  });
});
