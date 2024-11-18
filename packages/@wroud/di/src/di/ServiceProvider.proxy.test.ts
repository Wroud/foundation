///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { proxy } from "../implementation-resolvers/proxy.js";

describe("ServiceProvider", () => {
  it("should resolve proxies without copies", () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B");
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [BService]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, proxy(CService))
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const c = serviceProvider.getService(CService);
    const b = serviceProvider.getService(BService);
    const a = serviceProvider.getService(AService);

    expect(b.deps).toEqual([]);
    expect(c.deps).toEqual([b]);
    expect(a).toEqual(c);
  });
  it("should dispose in order proxy services", () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B", () => []);
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [BService]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addTransient(AService, proxy(CService))
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const c = serviceProvider.getService(CService);
    const b = serviceProvider.getService(BService);
    const a = serviceProvider.getService(AService);

    serviceProvider[Symbol.dispose]();

    expect(a[Symbol.dispose]).toHaveBeenCalledOnce();
    expect(b[Symbol.dispose]).toHaveBeenCalledOnce();
    expect(c[Symbol.dispose]).toHaveBeenCalledOnce();
    expect(b[Symbol.dispose]).toHaveBeenCalledAfter(a[Symbol.dispose]);
    expect(a[Symbol.dispose]).toBeCalled();
  });
});
