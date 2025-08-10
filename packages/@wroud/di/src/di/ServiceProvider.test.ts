///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceRegistry } from "./ServiceRegistry.js";
import { injectable } from "./injectable.js";
import { createSyncMockedService } from "../tests/createSyncMockedService.js";
import { createService } from "./createService.js";

describe("ServiceProvider", () => {
  it("should be defined", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toBeDefined();
  });
  it("should have getServices method", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toHaveProperty("getServices");
  });
  it("should have getService method", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toHaveProperty("getService");
  });
  it("should have createScope method", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toHaveProperty("createScope");
  });
  it("should resolve IServiceProvider to itself", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider.getService(IServiceProvider)).toBe(serviceProvider);
  });
  it("should resolve IServiceProvider[] to itself", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    const providers = serviceProvider.getServices(IServiceProvider);
    expect(providers.length).toEqual(1);
    expect(providers[0]).toBe(serviceProvider);
  });
  it("should create scope", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    const scope = serviceProvider.createScope();
    expect(scope).toBeDefined();

    const providers = scope.serviceProvider.getServices(IServiceProvider);
    expect(providers.length).toEqual(1);
    expect(providers[0]).toBe(scope.serviceProvider);
  });
  it("should dispose scope", () => {
    const Disposable = createSyncMockedService("Disposable");
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Disposable)
      .build();
    const scope = serviceProvider.createScope();
    const instance = scope.serviceProvider.getService(Disposable);

    scope[Symbol.dispose]();
    expect(instance[Symbol.dispose]).toBeCalled();
  });
  it("should dispose", () => {
    const Disposable = createSyncMockedService("Disposable");
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Disposable)
      .build();
    const instance = serviceProvider.getService(Disposable);
    serviceProvider[Symbol.dispose]();
    expect(instance[Symbol.dispose]).toBeCalled();
  });
  it("should dispose in order", () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B", () => [A]);
    const C = createSyncMockedService("C", () => [B]);

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(A)
      .addSingleton(B)
      .addSingleton(C)
      .build();

    const c = serviceProvider.getService(C);
    const b = serviceProvider.getService(B);
    const a = serviceProvider.getService(A);

    serviceProvider[Symbol.dispose]();

    expect(c[Symbol.dispose]).toHaveBeenCalledBefore(b[Symbol.dispose]);
    expect(b[Symbol.dispose]).toHaveBeenCalledBefore(a[Symbol.dispose]);
    expect(a[Symbol.dispose]).toBeCalled();
  });
  it("should throw on missing service", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(() => serviceProvider.getService(Number)).toThrowError(
      'No service of type "Number" is registered',
    );
  });
  it("should throw on missing service with name", () => {
    class Test {}
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      'No service of type "Test" is registered',
    );
  });
  it("should throw on missing service with name from registry", () => {
    class Test {}
    ServiceRegistry.register(Test, {
      name: "Test custom name",
      dependencies: [],
    });
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      'No service of type "Test custom name" is registered',
    );
  });
  it("should resolve service", () => {
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Number)
      .build();
    expect(serviceProvider.getService(Number)).toBe(Number.NaN);
  });
  it("should resolve service with dependencies", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => 42)
      .build();
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).number).toBe(42);
    expect(serviceProvider.getService(Test)).toBe(
      serviceProvider.getService(Test),
    );
  });
  it("should resolve service with multiple dependencies", () => {
    @injectable(() => [Number, String])
    class Test {
      constructor(
        public number: Number,
        public string: String,
      ) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => 42)
      .addSingleton(String, () => "42")
      .build();
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).number).toBe(42);
    expect(serviceProvider.getService(Test).string).toBe("42");
    expect(serviceProvider.getService(Test)).toBe(
      serviceProvider.getService(Test),
    );
  });
  it("should not resolve class service that not registered in ServiceRegistry", () => {
    class Test {}
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      'Class "Test" not registered as service',
    );
  });
  it("should catch exceptions when resolving service", () => {
    @injectable()
    class Test {}
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test, () => {
        throw new Error("Test error");
      })
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError("Test error");
  });
  it("should catch exceptions when resolving service with dependencies", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => {
        throw new Error("Test error");
      })
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError("Test error");
  });
  it("should resolve singleton with static implementation", () => {
    @injectable()
    class Test {}
    const impl = new Test();
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test, impl)
      .build();
    expect(serviceProvider.getService(Test)).toBe(impl);
  });
  it("should resolve service with array dependencies", () => {
    @injectable(() => [[Number]])
    class Test {
      constructor(public numbers: Number[]) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => 42)
      .build();
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).numbers).toEqual([42]);
    expect(serviceProvider.getService(Test)).toBe(
      serviceProvider.getService(Test),
    );
  });
  it("should resolve service with multiple dependencies in reverse order", () => {
    @injectable(() => [String, Number])
    class Test {
      constructor(
        public string: String,
        public number: Number,
      ) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => 42)
      .addSingleton(String, () => "42")
      .build();
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).number).toBe(42);
    expect(serviceProvider.getService(Test).string).toBe("42");
    expect(serviceProvider.getService(Test)).toBe(
      serviceProvider.getService(Test),
    );
  });
  it("should not resolve scoped service without scope", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test)
      .addSingleton(Number, () => 42)
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      "Scoped services require a service scope.",
    );
  });
  it("should resolve scoped service with scope", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test)
      .addSingleton(Number, () => 42)
      .build();
    const scope = serviceProvider.createScope();
    expect(scope.serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(scope.serviceProvider.getService(Test).number).toBe(42);
    expect(scope.serviceProvider.getService(Test)).toBe(
      scope.serviceProvider.getService(Test),
    );
    expect(() => serviceProvider.getService(Test)).toThrowError(
      "Scoped services require a service scope.",
    );
  });
  it("should resolve service in nested scope", () => {
    @injectable(() => [Number])
    class Test {
      constructor(public number: Number) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test)
      .addSingleton(Number, () => 42)
      .build();
    const scope = serviceProvider.createScope();
    const nestedScope = scope.serviceProvider.createScope();
    expect(nestedScope.serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(nestedScope.serviceProvider.getService(Test).number).toBe(42);
    expect(nestedScope.serviceProvider.getService(Test)).toBe(
      nestedScope.serviceProvider.getService(Test),
    );
    expect(scope.serviceProvider.getService(Test)).not.toBe(
      nestedScope.serviceProvider.getService(Test),
    );
    expect(() => serviceProvider.getService(Test)).toThrowError(
      "Scoped services require a service scope.",
    );
  });
  it("should not resolve singleton with scoped dependencies", () => {
    @injectable()
    class Test {}
    @injectable(() => [Test])
    class Test2 {
      constructor(public test: Test) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test2)
      .addScoped(Test)
      .build();
    const scope = serviceProvider.createScope();
    expect(() => scope.serviceProvider.getService(Test2)).toThrowError(
      `Scoped service cannot be resolved from singleton service.`,
    );
  });
  it("should resolve scoped service with singleton dependencies", () => {
    @injectable()
    class Test {}
    @injectable(() => [Test])
    class Test2 {
      constructor(public test: Test) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test2)
      .addSingleton(Test)
      .build();
    const scope = serviceProvider.createScope();
    expect(scope.serviceProvider.getService(Test2)).toBeInstanceOf(Test2);
    expect(scope.serviceProvider.getService(Test2).test).toBeInstanceOf(Test);
    expect(scope.serviceProvider.getService(Test2)).toBe(
      scope.serviceProvider.getService(Test2),
    );
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test)).toBe(
      scope.serviceProvider.getService(Test2).test,
    );
    expect(scope.serviceProvider.getService(Test)).toBe(
      serviceProvider.getService(Test),
    );

    expect(() => serviceProvider.getService(Test2)).toThrowError(
      "Scoped services require a service scope.",
    );
  });
  it("should resolve different instancies and dependencies in different scope", () => {
    @injectable()
    class Test {}
    @injectable(() => [Test])
    class Test2 {
      constructor(public test: Test) {}
    }
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test2)
      .addScoped(Test)
      .build();
    const scope = serviceProvider.createScope();
    expect(scope.serviceProvider.getService(Test2)).toBeInstanceOf(Test2);
    expect(scope.serviceProvider.getService(Test2).test).toBeInstanceOf(Test);
    expect(scope.serviceProvider.getService(Test2)).toBe(
      scope.serviceProvider.getService(Test2),
    );
    expect(scope.serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(scope.serviceProvider.getService(Test)).toBe(
      scope.serviceProvider.getService(Test2).test,
    );
    expect(scope.serviceProvider.getService(Test)).toBe(
      scope.serviceProvider.getService(Test),
    );

    const scope2 = scope.serviceProvider.createScope();
    expect(scope.serviceProvider.getService(Test2)).not.equal(
      scope2.serviceProvider.getService(Test2),
    );
    expect(scope.serviceProvider.getService(Test)).not.equal(
      scope2.serviceProvider.getService(Test),
    );
    expect(scope.serviceProvider.getService(Test2).test).not.equal(
      scope2.serviceProvider.getService(Test2).test,
    );
  });
  it("should not initialize copy of previously resolved service when resolving multiple services", () => {
    const A = createSyncMockedService("A");
    const B = createSyncMockedService("B");
    const S = createService("S");

    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(S, A)
      .addSingleton(S, B)
      .build();

    serviceProvider.getService(S);
    expect(A.constructorMock).toBeCalledTimes(0);
    expect(B.constructorMock).toBeCalledTimes(1);

    serviceProvider.getServices(S);
    expect(A.constructorMock).toBeCalledTimes(1);
    expect(B.constructorMock).toBeCalledTimes(1);
  });
});
