///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it } from "vitest";
import { ServiceInstancesStore } from "./ServiceInstancesStore.js";
import type { IServiceDescriptor } from "../types/IServiceDescriptor.js";
import { ServiceLifetime } from "./ServiceLifetime.js";

describe("ServiceInstancesStore", () => {
  it("should not replace added instances", async () => {
    const store = new ServiceInstancesStore();
    const descriptor: IServiceDescriptor<{}> = {
      service: {} as any,
      resolver: {} as any,
      lifetime: ServiceLifetime.Singleton,
    };
    const instance1 = {};

    const instanceInfo = store.addInstance(descriptor, null);
    instanceInfo.initialize(() => instance1, []);
    expect(store.addInstance(descriptor, null)).toBe(instanceInfo);
  });
  it("should has", async () => {
    const store = new ServiceInstancesStore();
    const descriptor: IServiceDescriptor<{}> = {
      service: {} as any,
      resolver: {} as any,
      lifetime: ServiceLifetime.Singleton,
    };

    store.addInstance(descriptor, null);
    expect(store.hasInstanceOf(descriptor)).toBe(true);
    expect(
      store.hasInstanceOf({
        ...descriptor,
      }),
    ).toBe(false);
  });
});
