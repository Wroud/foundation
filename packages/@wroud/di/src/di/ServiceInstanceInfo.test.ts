///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it, vi } from "vitest";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { ServiceInstanceInfo } from "./ServiceInstanceInfo.js";
import type { IServiceDescriptor } from "../types/IServiceDescriptor.js";

describe("ServiceInstanceInfo", () => {
  it("should not replace instance", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    instanceInfo.initialize(() => ({}) as any, []);
    const inst1 = instanceInfo.instance;
    instanceInfo.initialize(() => ({}) as any, []);
    const inst2 = instanceInfo.instance;
    expect(inst1).toBe(inst2);
  });
  it("should not dispose instance twice", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.initialize(
      () => ({
        [Symbol.dispose]: dispose,
      }),
      [],
    );

    instanceInfo.disposeSync();
    expect(() => instanceInfo.disposeSync()).not.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should not dispose async instance twice", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.initialize(
      () => ({
        [Symbol.asyncDispose]: dispose,
      }),
      [],
    );

    await instanceInfo.disposeAsync();
    await instanceInfo.disposeAsync();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should dispose errored instance multiple times", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn(() => {
      throw new Error();
    });

    instanceInfo.initialize(
      () => ({
        [Symbol.dispose]: dispose,
      }),
      [],
    );

    expect(() => instanceInfo.disposeSync()).toThrow();
    expect(() => instanceInfo.disposeSync()).toThrow();
  });
  it("should dispose async errored instance multiple times", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn(() => {
      throw new Error();
    });

    instanceInfo.initialize(
      () => ({
        [Symbol.asyncDispose]: dispose,
      }),
      [],
    );

    await expect(instanceInfo.disposeAsync()).rejects.toThrow();
    await expect(instanceInfo.disposeAsync()).rejects.toThrow();
  });
  it("should throw if instance is not initialized", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    expect(() => instanceInfo.instance).toThrow(
      'Service "Object" is not initialized (circular dependency)',
    );
  });
  it("should dispose dependents first", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dependent = new ServiceInstanceInfo(mockDescriptor());
    const disposeA = vi.fn();
    const disposeDependent = vi.fn();

    instanceInfo.initialize(
      () => ({
        [Symbol.dispose]: disposeA,
      }),
      [],
    );
    instanceInfo.addDependent(dependent);
    dependent.initialize(
      () => ({
        [Symbol.dispose]: disposeDependent,
      }),
      [],
    );

    instanceInfo.disposeSync();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledBefore(disposeA);
  });
  it("should dispose async dependents first", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dependent = new ServiceInstanceInfo(mockDescriptor());
    const disposeA = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );
    const disposeDependent = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );

    instanceInfo.initialize(
      () => ({
        [Symbol.asyncDispose]: disposeA,
      }),
      [],
    );
    instanceInfo.addDependent(dependent);
    dependent.initialize(
      () => ({
        [Symbol.asyncDispose]: disposeDependent,
      }),
      [],
    );

    await instanceInfo.disposeAsync();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledBefore(disposeA);
  });
  it("should dispose sync as a fallback for async dispose", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dependent = new ServiceInstanceInfo(mockDescriptor());
    const disposeA = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );
    const disposeDependent = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );

    instanceInfo.initialize(
      () => ({
        [Symbol.asyncDispose]: disposeA,
      }),
      [],
    );
    instanceInfo.addDependent(dependent);
    dependent.initialize(
      () => ({
        [Symbol.dispose]: disposeDependent,
      }),
      [],
    );

    await instanceInfo.disposeAsync();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledBefore(disposeA);
  });
  it("should not dispose async as a fallback for sync dispose", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dependent = new ServiceInstanceInfo(mockDescriptor());
    const disposeA = vi.fn();
    const disposeDependent = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );

    instanceInfo.initialize(
      () => ({
        [Symbol.dispose]: disposeA,
      }),
      [],
    );
    instanceInfo.addDependent(dependent);
    dependent.initialize(
      () => ({
        [Symbol.asyncDispose]: disposeDependent,
      }),
      [],
    );

    instanceInfo.disposeSync();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledTimes(0);
  });
  it("should use 'dispose' method if 'Symbol.dispose' is not available", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.initialize(
      () => ({
        dispose,
      }),
      [],
    );

    instanceInfo.disposeSync();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should use 'Symbol.dispose' when both 'dispose' and 'Symbol.dispose' are provided", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const disposeFn = vi.fn();
    const disposeSymbol = vi.fn();

    instanceInfo.initialize(
      () => ({
        [Symbol.dispose]: disposeSymbol,
        dispose: disposeFn,
      }),
      [],
    );

    instanceInfo.disposeSync();
    expect(disposeSymbol).toHaveBeenCalledTimes(1);
    expect(disposeFn).toHaveBeenCalledTimes(0);
  });
  it("should use 'dispose' method if 'Symbol.asyncDispose' is not available", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.initialize(
      () => ({
        dispose,
      }),
      [],
    );

    await instanceInfo.disposeAsync();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should use 'Symbol.asyncDispose' when both 'dispose' and 'Symbol.asyncDispose' are provided", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const disposeFn = vi.fn();
    const disposeSymbol = vi.fn();

    instanceInfo.initialize(
      () => ({
        [Symbol.asyncDispose]: disposeSymbol,
        dispose: disposeFn,
      }),
      [],
    );

    await instanceInfo.disposeAsync();
    expect(disposeSymbol).toHaveBeenCalledTimes(1);
    expect(disposeFn).toHaveBeenCalledTimes(0);
  });
});

function mockDescriptor<T>(): IServiceDescriptor<T> {
  return {
    service: {} as any,
    resolver: {} as any,
    lifetime: ServiceLifetime.Singleton,
  };
}
