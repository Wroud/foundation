///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { withExternal } from "../extras/service-type-resolvers/withExternal.js";
import { external } from "../extras/implementation-resolvers/external.js";
import { injectable } from "./injectable.js";
import "../debugDevelopment.js";

describe("ServiceProvider", () => {
  it("should resolve external services", () => {
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
      .addSingleton(AService, external())
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const a = new A();
    const b = serviceProvider.getService(BService);

    const c = serviceProvider.getService(
      withExternal(CService).set(AService, a),
    );

    expect(c).toBeInstanceOf(C);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });
  it("should resolve deep external services", () => {
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

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, external())
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const a = new A();

    const c = serviceProvider.getService(
      withExternal(CService).set(AService, a),
    );
    const b = serviceProvider.getService(BService);

    expect(c).toBeInstanceOf(C);
    expect(c.b.a).toBe(a);
    expect(c.b).toBe(b);
  });
  it("should validate external services", async () => {
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

    await expect(
      new ServiceContainerBuilder()
        .addSingleton(AService, external())
        .addSingleton(BService, B)
        .addSingleton(CService, C)
        .validate(),
    ).toResolve();
  });
});
