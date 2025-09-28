///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { factory } from "../implementation-resolvers/factory.js";
import { injectable } from "./injectable.js";
import "../debugDevelopment.js";

describe("ServiceProvider", () => {
  it("should resolve factory services", () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [])
    class B {
      constructor() {}
    }
    const BService = createService<typeof B>("B");

    function createC(a: A, b: B) {
      return { a, b };
    }
    const CService = createService<ReturnType<typeof createC>>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, B)
      .addSingleton(
        CService,
        factory((a, b) => createC(a, b), AService, BService),
      )
      .build();

    const b = serviceProvider.getService(BService);
    const a = serviceProvider.getService(AService);
    const c = serviceProvider.getService(CService);

    expect(c).toBeInstanceOf(Object);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });
  it("should resolve factory with no arguments", () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [])
    class B {
      constructor() {}
    }
    const BService = createService<typeof B>("B");
    @injectable(() => [BService, AService])
    class C {
      constructor(
        public b: B,
        public a: A,
      ) {}
    }
    const CService = createService<typeof C>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, A)
      .addSingleton(BService, B)
      .addSingleton(
        CService,
        factory((a) => new C(a.getService(BService), a.getService(AService))),
      )
      .build();

    const b = serviceProvider.getService(BService);
    const a = serviceProvider.getService(AService);
    const c = serviceProvider.getService(CService);

    expect(c).toBeInstanceOf(C);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });
  it("should validate factory services", async () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [])
    class B {
      constructor() {}
    }
    const BService = createService<typeof B>("B");
    @injectable(() => [BService, AService])
    class C {
      constructor(
        public b: B,
        public a: A,
      ) {}
    }
    const CService = createService<typeof C>("C");

    await expect(
      new ServiceContainerBuilder()
        .addSingleton(AService, A)
        .addSingleton(BService, B)
        .addSingleton(
          CService,
          factory((a, b) => new C(b, a), AService, BService),
        )
        .validate(),
    ).toResolve();
  });
});
