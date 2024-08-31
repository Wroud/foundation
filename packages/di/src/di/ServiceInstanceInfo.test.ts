///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it, vi } from "vitest";
import { ServiceLifetime } from "./ServiceLifetime.js";
import { ServiceInstanceInfo } from "./ServiceInstanceInfo.js";
import type { IServiceDescriptor } from "../types/IServiceDescriptor.js";

describe("ServiceInstanceInfo", () => {
  it("should not replace instance", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());

    expect(() => instanceInfo.addInstance({} as any)).not.toThrow();
    expect(() => instanceInfo.addInstance({} as any)).toThrow(
      "Instance already initialized",
    );
  });
  it("should not dispose instance twice", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.addInstance({
      [Symbol.dispose]: dispose,
    });

    instanceInfo.disposeSync();
    expect(() => instanceInfo.disposeSync()).not.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should not dispose async instance twice", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn();

    instanceInfo.addInstance({
      [Symbol.asyncDispose]: dispose,
    });

    await instanceInfo.disposeAsync();
    await instanceInfo.disposeAsync();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
  it("should dispose errored instance multiple times", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn(() => {
      throw new Error();
    });

    instanceInfo.addInstance({
      [Symbol.dispose]: dispose,
    });

    expect(() => instanceInfo.disposeSync()).toThrow();
    expect(() => instanceInfo.disposeSync()).toThrow();
  });
  it("should dispose async errored instance multiple times", async () => {
    const instanceInfo = new ServiceInstanceInfo(mockDescriptor());
    const dispose = vi.fn(() => {
      throw new Error();
    });

    instanceInfo.addInstance({
      [Symbol.asyncDispose]: dispose,
    });

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

    instanceInfo.addInstance({
      [Symbol.dispose]: disposeA,
    });
    instanceInfo.addDependent(dependent);
    dependent.addInstance({
      [Symbol.dispose]: disposeDependent,
    });

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

    instanceInfo.addInstance({
      [Symbol.asyncDispose]: disposeA,
    });
    instanceInfo.addDependent(dependent);
    dependent.addInstance({
      [Symbol.asyncDispose]: disposeDependent,
    });

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

    instanceInfo.addInstance({
      [Symbol.asyncDispose]: disposeA,
    });
    instanceInfo.addDependent(dependent);
    dependent.addInstance({
      [Symbol.dispose]: disposeDependent,
    });

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

    instanceInfo.addInstance({
      [Symbol.dispose]: disposeA,
    });
    instanceInfo.addDependent(dependent);
    dependent.addInstance({
      [Symbol.asyncDispose]: disposeDependent,
    });

    instanceInfo.disposeSync();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeDependent).toHaveBeenCalledTimes(0);
  });
});

function mockDescriptor<T>(): IServiceDescriptor<T> {
  return {
    service: {} as any,
    implementation: {} as any,
    lifetime: ServiceLifetime.Singleton,
    loader: null,
  };
}
