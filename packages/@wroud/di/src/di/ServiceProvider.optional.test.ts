///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { optional } from "../service-type-resolvers/optional.js";
import { lazy } from "../implementation-resolvers/lazy.js";

describe("ServiceProvider", () => {
  it("should resolve optional services", () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B", () => [optional(AService)]);
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [optional(BService)]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const c = serviceProvider.getService(CService);

    expect(c.deps[0].resolve()).toEqual(serviceProvider.getService(BService));
    expect(c.deps[0].resolve().deps[0].resolve()).toEqual(
      serviceProvider.getService(AService),
    );

    const b = serviceProvider.getService(BService);
    const a = serviceProvider.getService(AService);

    expect(b.deps).toHaveLength(1);
    expect(c.deps).toHaveLength(1);
    expect(a.deps).toHaveLength(0);
  });
  it("should resolve optional async services", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B", () => [optional(AService)]);
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [optional(BService)]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        AService,
        lazy(() => Promise.resolve(A)),
      )
      .addSingleton(
        BService,
        lazy(() => Promise.resolve(B)),
      )
      .addSingleton(CService, C)
      .build();

    const c = serviceProvider.getService(CService);

    expect(await c.deps[0].resolveAsync()).toEqual(
      await serviceProvider.getServiceAsync(BService),
    );
    expect(
      await c.deps[0]
        .resolveAsync()
        .then((b: InstanceType<typeof B>) => b.deps[0].resolveAsync()),
    ).toEqual(await serviceProvider.getServiceAsync(AService));

    const b = await serviceProvider.getServiceAsync(BService);
    const a = await serviceProvider.getServiceAsync(AService);

    expect(b.deps).toHaveLength(1);
    expect(c.deps).toHaveLength(1);
    expect(a.deps).toHaveLength(0);
  });
});