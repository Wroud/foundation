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
      implementation: {} as any,
      lifetime: ServiceLifetime.Singleton,
      loader: null,
    };
    const instance1 = {};

    const instanceInfo = store.addInstance(descriptor);
    instanceInfo.addInstance(instance1);
    expect(() => {
      store.addInstance(descriptor);
    }).toThrow();
  });
});
