///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { injectable } from "./injectable.js";

describe("ServiceProvider", () => {
  it("should resolve transient service", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    @injectable(() => [Test])
    class Test2 {
      constructor(public test: Test) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addTransient(Test)
      .addTransient(Test2)
      .addSingleton(Number, () => 42)
      .build();

    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).number).toBe(42);
    expect(serviceProvider.getService(Test)).not.toBe(
      serviceProvider.getService(Test),
    );
    expect(serviceProvider.getService(Test2)).not.toBe(
      serviceProvider.getService(Test2),
    );
    expect(serviceProvider.getService(Test2).test).not.toBe(
      serviceProvider.getService(Test),
    );
    expect(serviceProvider.getService(Test2).test).not.toBe(
      serviceProvider.getService(Test2).test,
    );
  });
});
