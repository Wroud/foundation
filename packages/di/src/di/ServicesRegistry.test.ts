import { describe, expect, it } from "@jest/globals";
import { ServicesRegistry } from "./ServicesRegistry.js";

describe("ServicesRegistry", () => {
  it("should be defined", () => {
    expect(ServicesRegistry).toBeDefined();
  });
  it("should have get method", () => {
    expect(ServicesRegistry).toHaveProperty("get");
  });
  it("should have has method", () => {
    expect(ServicesRegistry).toHaveProperty("has");
  });
  it("should have register method", () => {
    expect(ServicesRegistry).toHaveProperty("register");
  });
  it("should register service", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(ServicesRegistry.has(Test)).toBe(true);
  });
  it("should get service", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(ServicesRegistry.get(Test)).toEqual({
      name: "Test",
      dependencies: [],
    });
  });
  it("should not have service", () => {
    class Test {}
    expect(ServicesRegistry.has(Test)).toBe(false);
  });
  it("should not get service", () => {
    class Test {}
    expect(ServicesRegistry.get(Test)).toBeUndefined();
  });
  it("should throw on duplicate registration", () => {
    class Test {}
    ServicesRegistry.register(Test, { name: "Test", dependencies: [] });
    expect(() =>
      ServicesRegistry.register(Test, { name: "Test", dependencies: [] }),
    ).toThrowError("Service Test is already registered");
  });
  it("should be empty after GC", () => {
    if (global.gc) {
      global.gc();
    }
    const afterCreationMemoryUsage = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      ServicesRegistry.register(createComplexClass(), {
        name: "Test",
        dependencies: [],
      });
    }

    if (global.gc) {
      global.gc();
    }

    expect(
      Math.abs(afterCreationMemoryUsage - process.memoryUsage().heapUsed),
    ).toBeLessThan(200000); // this test can fail if any other tests throw an error
  });
});

function createComplexClass() {
  eval("");
  class A {}
  class B {}
  class C {}
  class D {}
  class E {}
  class F {}
  class G {}
  class H {}
  class I {}
  class J {}
  class K {}
  class L {}
  class M {}
  class N {}
  class O {}
  class P {}
  class Q {}
  class R {}
  class S {}
  class T {}
  class U {}
  class V {}
  class W {}
  class X {}
  class Y {}
  class Z {}

  return class {
    a = new A();
    b = new B();
    c = new C();
    d = new D();
    e = new E();
    f = new F();
    g = new G();
    h = new H();
    i = new I();
    j = new J();
    k = new K();
    l = new L();
    m = new M();
    n = new N();
    o = new O();
    p = new P();
    q = new Q();
    r = new R();
    s = new S();
    t = new T();
    u = new U();
    v = new V();
    w = new W();
    x = new X();
    y = new Y();
    z = new Z();

    constructor() {
      this.a = new A();
      this.b = new B();
      this.c = new C();
      this.d = new D();
      this.e = new E();
      this.f = new F();
      this.g = new G();
      this.h = new H();
      this.i = new I();
      this.j = new J();
      this.k = new K();
      this.l = new L();
      this.m = new M();
      this.n = new N();
      this.o = new O();
      this.p = new P();
      this.q = new Q();
      this.r = new R();
      this.s = new S();
      this.t = new T();
      this.u = new U();
      this.v = new V();
      this.w = new W();
      this.x = new X();
      this.y = new Y();
      this.z = new Z();
    }

    // complex methods boilerplate
    complexMethod1() {
      return this.a;
    }
    complexMethod2() {
      return this.b;
    }
    complexMethod3() {
      return this.c;
    }
    complexMethod4() {
      return this.d;
    }
    complexMethod5() {
      return this.e;
    }
    complexMethod6() {
      return this.f;
    }
    complexMethod7() {
      return this.g;
    }
    complexMethod8() {
      return this.h;
    }
    complexMethod9() {
      return this.i;
    }
    complexMethod10() {
      return this.j;
    }
    complexMethod11() {
      return this.k;
    }
    complexMethod12() {
      return this.l;
    }
    complexMethod13() {
      return this.m;
    }
    complexMethod14() {
      return this.n;
    }
    complexMethod15() {
      return this.o;
    }
    complexMethod16() {
      return this.p;
    }
    complexMethod17() {
      return this.q;
    }
    complexMethod18() {
      return this.r;
    }
    complexMethod19() {
      return this.s;
    }
    complexMethod20() {
      return this.t;
    }
    complexMethod21() {
      return this.u;
    }
    complexMethod22() {
      return this.v;
    }
    complexMethod23() {
      return this.w;
    }
    complexMethod24() {
      return this.x;
    }
    complexMethod25() {
      return this.y;
    }
    complexMethod26() {
      return this.z;
    }

    complexMethodsWithLoopsAndSwitch() {
      const methods = [];
      for (let i = 1; i <= 26; i++) {
        const methodName = `complexMethod${i}`;
        const method = () => {
          let result;
          switch (i) {
            case 1:
              result = this.a;
              break;
            case 2:
              result = this.b;
              break;
            case 3:
              result = this.c;
              break;
            case 4:
              result = this.d;
              break;
            case 5:
              result = this.e;
              break;
            case 6:
              result = this.f;
              break;
            case 7:
              result = this.g;
              break;
            case 8:
              result = this.h;
              break;
            case 9:
              result = this.i;
              break;
            case 10:
              result = this.j;
              break;
            case 11:
              result = this.k;
              break;
            case 12:
              result = this.l;
              break;
            case 13:
              result = this.m;
              break;
            case 14:
              result = this.n;
              break;
            case 15:
              result = this.o;
              break;
            case 16:
              result = this.p;
              break;
            case 17:
              result = this.q;
              break;
            case 18:
              result = this.r;
              break;
            case 19:
              result = this.s;
              break;
            case 20:
              result = this.t;
              break;
            case 21:
              result = this.u;
              break;
            case 22:
              result = this.v;
              break;
            case 23:
              result = this.w;
              break;
            case 24:
              result = this.x;
              break;
            case 25:
              result = this.y;
              break;
            case 26:
              result = this.z;
              break;
            default:
              result = null;
              break;
          }
          return result;
        };
        (this as any)[methodName] = method;
        methods.push(methodName);
      }
      return methods;
    }
  };
}
