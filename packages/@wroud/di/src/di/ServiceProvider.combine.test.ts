///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { all, lazy, optional, proxy } from "../production.js";

describe("ServiceProvider", () => {
  it("should resolve optional(all())", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .build();

    const a = serviceProvider.getService(optional(all(AService)));

    expect(a.resolve).toBeDefined();
    expect(a.resolveAsync).toBeDefined();

    expect(a.resolve()).toHaveLength(1);
    expect(a.resolve()[0]).toBeInstanceOf(A);
    await expect(a.resolveAsync().then((a) => a[0])).resolves.toBeInstanceOf(A);
  });
  it("should resolve all(optional())", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .build();

    const a = serviceProvider.getService(all(optional(AService)));

    expect(a).toHaveLength(1);
    expect(a[0]!.resolve).toBeDefined();
    expect(a[0]!.resolveAsync).toBeDefined();

    expect(a[0]!.resolve()).toBeInstanceOf(A);
    await expect(a[0]!.resolveAsync()).resolves.toBeInstanceOf(A);
  });
  it("should resolve proxy() + all()", () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const BService = createService<InstanceType<typeof A>>("B");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, proxy(AService))
      .build();

    const a = serviceProvider.getService(all(BService));

    expect(a).toHaveLength(1);
    expect(a[0]).toBeInstanceOf(A);
  });
  it("should resolve proxy() + single()", () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const BService = createService<InstanceType<typeof A>>("B");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, proxy(AService))
      .build();

    const a = serviceProvider.getService(BService);

    expect(a).toBeInstanceOf(A);
  });
  it("should resolve lazy() + proxy()", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const BService = createService<InstanceType<typeof A>>("B");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(
        BService,
        lazy(() => Promise.resolve(proxy(AService))),
      )
      .build();

    const a = await serviceProvider.getServiceAsync(BService);

    expect(a).toBeInstanceOf(A);
  });
});
