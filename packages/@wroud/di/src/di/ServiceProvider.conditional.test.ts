///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { conditional } from "../extras/implementation-resolvers/conditional.js";
import { injectable } from "./injectable.js";
import "../debugDevelopment.js";

describe("ServiceProvider", () => {
  it("should resolve conditional services", () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    @injectable(() => [])
    class B {
      constructor() {}
    }
    const AOrBService = createService<typeof A | typeof B>("A or B");

    let callCount = 0;

    const serviceProvider = new ServiceContainerBuilder()
      .addTransient(
        AOrBService,
        conditional((): A | B => {
          callCount++;
          return callCount % 2 === 0 ? A : B;
        }),
      )
      .build();

    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(B);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(A);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(B);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(A);
    expect(callCount).toBe(4);
  });
  it("should resolve conditional async services", async () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    @injectable(() => [])
    class B {
      constructor() {}
    }
    const AOrBService = createService<typeof A | typeof B>("A or B");

    let callCount = 0;

    const serviceProvider = new ServiceContainerBuilder()
      .addTransient(
        AOrBService,
        conditional(async (): Promise<A | B> => {
          callCount++;
          return callCount % 2 === 0 ? A : B;
        }),
      )
      .build();

    await expect(
      serviceProvider.getServiceAsync(AOrBService),
    ).resolves.toBeInstanceOf(B);
    await expect(
      serviceProvider.getServiceAsync(AOrBService),
    ).resolves.toBeInstanceOf(A);
    await expect(
      serviceProvider.getServiceAsync(AOrBService),
    ).resolves.toBeInstanceOf(B);
    await expect(
      serviceProvider.getServiceAsync(AOrBService),
    ).resolves.toBeInstanceOf(A);
    expect(callCount).toBe(4);
  });
  it("should resolve conditional with deps", () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [AService])
    class B {
      constructor(public a: A) {}
    }
    const BService = createService<typeof B>("B");
    @injectable(() => [BService])
    class C {
      constructor(public b: B) {}
    }
    const CService = createService<typeof C>("C");

    const AOrBService = createService<typeof A | typeof B>("A or B");

    let callCount = 0;
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .addTransient(
        AOrBService,
        conditional(
          (a, b): A | B => {
            expect(a).toBeInstanceOf(A);
            expect(b).toBeInstanceOf(B);
            callCount++;
            return callCount % 2 === 0 ? A : B;
          },
          AService,
          BService,
        ),
      )
      .build();

    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(B);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(A);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(B);
    expect(serviceProvider.getService(AOrBService)).toBeInstanceOf(A);
    expect(callCount).toBe(4);
  });
  it("should validate conditional services", async () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [AService])
    class B {
      constructor(public a: A) {}
    }
    const BService = createService<typeof B>("B");
    @injectable(() => [BService])
    class C {
      constructor(public b: B) {}
    }
    const CService = createService<typeof C>("C");
    const AOrBService = createService<typeof A | typeof B>("A or B");

    let callCount = 0;
    await expect(
      new ServiceContainerBuilder()
        .addSingleton(AService, A)
        .addSingleton(BService, B)
        .addSingleton(CService, C)
        .addTransient(
          AOrBService,
          conditional((): A | B => {
            callCount++;
            return callCount % 2 === 0 ? A : B;
          }),
        )
        .validate(),
    ).toResolve();
  });
});
