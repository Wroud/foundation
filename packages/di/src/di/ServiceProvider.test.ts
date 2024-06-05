import { describe, expect, it, jest } from "@jest/globals";
import { ServiceContainerBuilder } from "./ServiceContainerBuilder.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServicesRegistry } from "./ServicesRegistry.js";

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
  it("should have createAsyncScope method", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider).toHaveProperty("createAsyncScope");
  });
  it("should resolve IServiceProvider to itself", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider.getService(IServiceProvider)).toBe(serviceProvider);
  });
  it("should resolve IServiceProvider[] to itself", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    expect(serviceProvider.getServices(IServiceProvider)).toEqual([
      serviceProvider,
    ]);
  });
  it("should create scope", () => {
    const serviceProvider = new ServiceContainerBuilder().build();
    const scope = serviceProvider.createScope();
    expect(scope).toBeDefined();
    expect(scope.serviceProvider.getServices(IServiceProvider)).toEqual([
      serviceProvider,
    ]);
  });
  it("should dispose scope", () => {
    class Disposable {
      [Symbol.dispose] = jest.fn();
    }
    ServicesRegistry.register(Disposable, {
      name: "Disposable",
      dependencies: [],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Disposable)
      .build();
    const scope = serviceProvider.createScope();
    const instance = scope.serviceProvider.getService(Disposable);

    scope[Symbol.dispose]();
    expect(instance[Symbol.dispose]).toBeCalled();
  });
  it("should async dispose scope", async () => {
    class Disposable {
      [Symbol.asyncDispose] = jest.fn();
    }
    ServicesRegistry.register(Disposable, {
      name: "Disposable",
      dependencies: [],
    });
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
    expect(scope.serviceProvider.getServices(IServiceProvider)).toEqual([
      serviceProvider,
    ]);
  });
  it("should dispose", () => {
    class Disposable {
      [Symbol.dispose] = jest.fn();
    }
    ServicesRegistry.register(Disposable, {
      name: "Disposable",
      dependencies: [],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Disposable)
      .build();
    const instance = serviceProvider.getService(Disposable);
    serviceProvider[Symbol.dispose]();
    expect(instance[Symbol.dispose]).toBeCalled();
  });
  it("should async dispose", async () => {
    class Disposable {
      [Symbol.asyncDispose] = jest.fn();
    }
    ServicesRegistry.register(Disposable, {
      name: "Disposable",
      dependencies: [],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Disposable)
      .build();
    const instance = serviceProvider.getService(Disposable);
    await serviceProvider[Symbol.asyncDispose]();
    expect(instance[Symbol.asyncDispose]).toBeCalled();
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
    ServicesRegistry.register(Test, {
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
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, { name: "Test", dependencies: [Number] });
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
    class Test {
      constructor(
        public number: Number,
        public string: String,
      ) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number, String] as const,
    });
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
  it("should not resolve class service that not registered in ServicesRegistry", () => {
    class Test {}
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      'Class "Test" not registered as service (please use @injectable or ServicesRegistry)',
    );
  });
  it("should catch exceptions when resolving service", () => {
    class Test {}
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test, () => {
        throw new Error("Test error");
      })
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError("Test error");
  });
  it("should catch exceptions when resolving service with dependencies", () => {
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test)
      .addSingleton(Number, () => {
        throw new Error("Test error");
      })
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError("Test error");
  });
  it("should resolve singleton with static implementation", () => {
    class Test {}
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [],
    });
    const impl = new Test();
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test, impl)
      .build();
    expect(serviceProvider.getService(Test)).toBe(impl);
  });
  it("should resolve service with array dependencies", () => {
    class Test {
      constructor(public numbers: Number[]) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [[Number]],
    });
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
    class Test {
      constructor(
        public string: String,
        public number: Number,
      ) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [String, Number] as const,
    });
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
  it("should resolve transient service", () => {
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addTransient(Test)
      .addSingleton(Number, () => 42)
      .build();
    expect(serviceProvider.getService(Test)).toBeInstanceOf(Test);
    expect(serviceProvider.getService(Test).number).toBe(42);
    expect(serviceProvider.getService(Test)).not.toBe(
      serviceProvider.getService(Test),
    );
  });
  it("should not resolve scoped service without scope", () => {
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addScoped(Test)
      .addSingleton(Number, () => 42)
      .build();
    expect(() => serviceProvider.getService(Test)).toThrowError(
      "Scoped services require a service scope.",
    );
  });
  it("should resolve scoped service with scope", () => {
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number],
    });
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
    class Test {
      constructor(public number: Number) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [Number],
    });
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
    class Test {}
    class Test2 {
      constructor(public test: Test) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [],
    });
    ServicesRegistry.register(Test2, {
      name: "Test2",
      dependencies: [Test],
    });
    const serviceProvider = new ServiceContainerBuilder()
      .addSingleton(Test2)
      .addScoped(Test)
      .build();
    const scope = serviceProvider.createScope();
    expect(() => scope.serviceProvider.getService(Test2)).toThrowError(
      'Scoped service "Test" cannot be resolved from singleton service.',
    );
  });
  it("should resolve scoped service with singleton dependencies", () => {
    class Test {}
    class Test2 {
      constructor(public test: Test) {}
    }
    ServicesRegistry.register(Test, {
      name: "Test",
      dependencies: [],
    });
    ServicesRegistry.register(Test2, {
      name: "Test2",
      dependencies: [Test],
    });
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
});
