///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { injectable } from "./injectable.js";
import { lazy } from "../implementation-resolvers/lazy.js";
import { createService } from "./createService.js";
import { createAsyncMockedService } from "../tests/createAsyncMockedService.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import type { AsyncServiceImplementationResolver } from "../implementation-resolvers/AsyncServiceImplementationResolver.js";

describe("ServiceProvider", () => {
  it("should have createAsyncScope method", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toHaveProperty("createAsyncScope");
  });
  it("should async dispose scope", async () => {
    const Disposable = createAsyncMockedService("Disposable");
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Disposable)
      .build();
    const scope = serviceProvider.createAsyncScope();
    const instance = scope.serviceProvider.getService(Disposable);

    await scope[Symbol.asyncDispose]();
    expect(instance[Symbol.asyncDispose]).toBeCalled();
  });
  it("should create async scope", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    const scope = serviceProvider.createAsyncScope();
    expect(scope).toBeDefined();

    const providers = scope.serviceProvider.getServices(IServiceProvider);
    expect(providers.length).toEqual(1);
    expect(providers[0]).toBe(scope.serviceProvider);
  });
  it("should resolve async loaded singletons without copies", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B", () => [AService]);
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [BService]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        AService,
        lazy(
          () =>
            new Promise<typeof A>((resolve) => {
              setTimeout(() => resolve(A), 10);
            }),
        ),
      )
      .addSingleton(
        BService,
        lazy(
          () =>
            new Promise<typeof B>((resolve) => {
              setTimeout(() => resolve(B), 10);
            }),
        ),
      )
      .addSingleton(
        CService,
        lazy(
          () =>
            new Promise<typeof C>((resolve) => {
              setTimeout(() => resolve(C), 10);
            }),
        ),
      )
      .build();

    const [c, b, a] = await Promise.all([
      serviceProvider.getServiceAsync(CService),
      serviceProvider.getServiceAsync(BService),
      serviceProvider.getServiceAsync(AService),
    ]);

    expect(b.deps).toEqual([a]);
    expect(c.deps).toEqual([b]);
    expect(a).toEqual(await serviceProvider.getServiceAsync(AService));
  });
  it("should dispose in order async services", async () => {
    const A = createSyncMockedService("A");
    const AService = createService<InstanceType<typeof A>>("A");
    const B = createSyncMockedService("B", () => [AService]);
    const BService = createService<InstanceType<typeof B>>("B");
    const C = createSyncMockedService("C", () => [BService]);
    const CService = createService<InstanceType<typeof C>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        AService,
        lazy(
          () =>
            new Promise<typeof A>((resolve) => {
              setTimeout(() => resolve(A), 10);
            }),
        ),
      )
      .addSingleton(
        BService,
        lazy(
          () =>
            new Promise<typeof B>((resolve) => {
              setTimeout(() => resolve(B), 10);
            }),
        ),
      )
      .addSingleton(
        CService,
        lazy(
          () =>
            new Promise<typeof C>((resolve) => {
              setTimeout(() => resolve(C), 10);
            }),
        ),
      )
      .build();

    const [c, b, a] = await Promise.all([
      serviceProvider.getServiceAsync(CService),
      serviceProvider.getServiceAsync(BService),
      serviceProvider.getServiceAsync(AService),
    ]);

    serviceProvider[Symbol.dispose]();

    expect(c[Symbol.dispose]).toHaveBeenCalledBefore(b[Symbol.dispose]);
    expect(b[Symbol.dispose]).toHaveBeenCalledBefore(a[Symbol.dispose]);
    expect(a[Symbol.dispose]).toBeCalled();
  });
  it("should resolve scoped service async with scope", async () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(
        Test,
        lazy(() => Promise.resolve(Test)),
      )
      .addSingleton(
        Number,
        lazy(() => Promise.resolve(42)),
      )
      .build();
    const scope = serviceProvider.createScope();
    await expect(
      scope.serviceProvider.getServiceAsync(Test),
    ).resolves.toBeInstanceOf(Test);
    await expect(
      scope.serviceProvider.getServiceAsync(Test),
    ).resolves.toHaveProperty("number", 42);
    await expect(scope.serviceProvider.getServiceAsync(Test)).resolves.toBe(
      await scope.serviceProvider.getServiceAsync(Test),
    );
    await expect(() =>
      serviceProvider.getServiceAsync(Test),
    ).rejects.toThrowError("Scoped services require a service scope.");
  });
  it("should resolve service with async implementation", async () => {
    const A = createSyncMockedService("A");
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        A,
        lazy(() => Promise.resolve(A)),
      )
      .build();

    expect(await serviceProvider.getServiceAsync(A)).toBeInstanceOf(A);
  });
  it("should throw on sync service resolve with async implementation", () => {
    const A = createAsyncMockedService("A");
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        A,
        lazy(() => Promise.resolve(A)),
      )
      .build();

    expect(() => serviceProvider.getService(A)).toThrowError(
      `Lazy service cannot be resolved synchronously`,
    );
  });
  it("should resolve multiple services async", async () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B");
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        A,
        lazy(() => Promise.resolve(A)),
      )
      .addSingleton(
        A,
        lazy(() => Promise.resolve(B)),
      )
      .build();

    const [a, b] = await serviceProvider.getServicesAsync(A);
    expect(a).toBeInstanceOf(A);
    expect(b).toBeInstanceOf(B);
  });
  it("should resolve chain of async services", async () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B", () => [A]);
    const C = createSyncMockedService("C", () => [B]);

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        A,
        lazy(() => Promise.resolve(A)),
      )
      .addSingleton(
        B,
        lazy(() => Promise.resolve(B)),
      )
      .addSingleton(
        C,
        lazy(() => Promise.resolve(C)),
      )
      .build();

    const c = await serviceProvider.getServiceAsync(C);
    const b = await serviceProvider.getServiceAsync(B);
    const a = await serviceProvider.getServiceAsync(A);

    expect(c).toBeInstanceOf(C);
    expect(b).toBeInstanceOf(B);
    expect(a).toBeInstanceOf(A);

    serviceProvider[Symbol.dispose]();

    expect(c[Symbol.dispose]).toHaveBeenCalledBefore(b[Symbol.dispose]);
    expect(b[Symbol.dispose]).toHaveBeenCalledBefore(a[Symbol.dispose]);
    expect(a[Symbol.dispose]).toBeCalled();
  });

  // seems like a nodejs bug, maybe related to https://github.com/nodejs/node/issues/50707
  it("should catch exception from async service loader", async () => {
    const A = createSyncMockedService("A");
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(
        A,
        lazy(async () => {
          throw new Error("Test error");
        }),
      )
      .build();

    await expect(() => serviceProvider.getServiceAsync(A)).rejects.toThrowError(
      "Test error",
    );
  });
  it("should not resolve async service synchronously if already loaded", async () => {
    const A = createSyncMockedService("A");
    const loader = lazy(() => Promise.resolve(A));

    // @ts-expect-error
    await (loader as AsyncServiceImplementationResolver<typeof A>).load();

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(A, loader)
      .build();

    expect(() => serviceProvider.getService(A)).toThrowError(
      "Lazy service cannot be resolved synchronously",
    );
  });
  it("should resolve async service concurrently", async () => {
    const A = createSyncMockedService("A");
    const loader = lazy(() => Promise.resolve(A));

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(A, loader)
      .build();

    const [a1, a2] = await Promise.all([
      serviceProvider.getServiceAsync(A),
      serviceProvider.getServiceAsync(A),
    ]);

    expect(a1).toBeInstanceOf(A);
    expect(a2).toBeInstanceOf(A);
    expect(a1).toBe(a2);
  });
  it("should throw on attempt to resolve async service implementation with circular dependency", async () => {
    const serviceB = createService("B");
    const A = createSyncMockedService("A", () => [serviceB]);
    const loaderA = lazy(() => Promise.resolve(A));
    const B = createSyncMockedService("B", () => [A]);
    const loaderB = lazy(() => Promise.resolve(B));

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(A, loaderA)
      .addSingleton(serviceB, loaderB)
      .build();

    await expect(() => serviceProvider.getServiceAsync(A)).rejects.toThrowError(
      "Cyclic dependency detected: A -> B -> A",
    );
  });
  it("should throw on attempt to resolve async service implementation with circular dependency with multiple services resolve", async () => {
    const serviceB = createService("B");
    const A = createSyncMockedService("A", () => [[serviceB]]);
    const loaderA = lazy(() => Promise.resolve(A));

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(serviceB, loaderA)
      .build();

    await expect(() =>
      serviceProvider.getServicesAsync(serviceB),
    ).rejects.toThrowError("Cyclic dependency detected: A (B) -> A (B)");
  });
  it("should not initialize copy of previously resolved service when resolving multiple services async", async () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B");
    const loaderA = lazy(
      () => new Promise((resolve) => setTimeout(() => resolve(A), 10)),
    );
    const loaderB = lazy(
      () => new Promise((resolve) => setTimeout(() => resolve(B), 10)),
    );
    const S = createService("S");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(S, loaderA)
      .addSingleton(S, loaderB)
      .build();

    const [b, [, b2]] = await Promise.all([
      serviceProvider.getServiceAsync(S),
      serviceProvider.getServicesAsync(S),
    ]);
    expect(b).toBe(b2);

    expect(A.constructorMock).toBeCalledTimes(1);
    expect(B.constructorMock).toBeCalledTimes(1);
  });
});
