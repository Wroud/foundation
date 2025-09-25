///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { createService } from "./createService.js";
import { withExternal } from "../extra/service-type-resolvers/withExternal.js";
import { external } from "../extra/implementation-resolvers/external.js";
import { injectable } from "./injectable.js";

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
      .addTransient(AService, external())
      .addSingleton(BService, B)
      .addSingleton(CService, C)
      .build();

    const a = new A();
    const b = serviceProvider.getService(BService);

    const c = serviceProvider.getService(
      withExternal(CService, [[AService, a]]),
    );

    expect(c).toBeInstanceOf(C);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });
  it("should throw exception if not transient", () => {
    @injectable(() => [])
    class A {
      constructor() {}
    }
    const AService = createService<typeof A>("A");
    @injectable(() => [AService])
    class C {
      constructor(public a: A) {}
    }
    const CService = createService<typeof C>("C");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(AService, external())
      .addSingleton(CService, C)
      .build();

    const a = new A();

    expect(() =>
      serviceProvider.getService(withExternal(CService, [[AService, a]])),
    ).toThrow();
  });
});
