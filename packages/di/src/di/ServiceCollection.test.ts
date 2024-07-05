import { ServiceLifetime } from "./IServiceDescriptor.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { describe, expect, it } from "@jest/globals";
import { ServiceRegistry } from "./ServiceRegistry.js";

describe("ServiceCollection", () => {
  it("should be defined", () => {
    expect(new ServiceCollection()).toBeDefined();
  });
  it("should have addSingleton method", () => {
    expect(new ServiceCollection()).toHaveProperty("addSingleton");
  });
  it("should have addTransient method", () => {
    expect(new ServiceCollection()).toHaveProperty("addTransient");
  });
  it("should have addScoped method", () => {
    expect(new ServiceCollection()).toHaveProperty("addScoped");
  });
  it("should have getDescriptors method", () => {
    expect(new ServiceCollection()).toHaveProperty("getDescriptors");
  });
  it("should be iterable", () => {
    const collection = new ServiceCollection();
    expect(collection[Symbol.iterator]).toBeDefined();
  });
  it("should return empty array for unknown service", () => {
    const collection = new ServiceCollection();
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors).toHaveLength(0);
  });
  it("should have IServiceProvider singleton", () => {
    const collection = new ServiceCollection();
    const descriptors = collection.getDescriptors(IServiceProvider);
    expect(descriptors).toHaveLength(1);
    expect(() => (descriptors[0]?.implementation as any)()).toThrowError(
      "Not implemented",
    );
  });
  it("should iterate over descriptors", () => {
    const collection = new ServiceCollection();
    collection.addTransient(Number);
    collection.addTransient(String);
    const descriptors = Array.from(collection);
    expect(descriptors).toHaveLength(3);
  });
  it("should register transient service", () => {
    const collection = new ServiceCollection();
    collection.addTransient(Number);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]?.lifetime).toBe(ServiceLifetime.Transient);
    expect(descriptors[0]?.service).toBe(Number);
    expect(descriptors[0]?.implementation).toBe(Number);
  });
  it("should register scoped service", () => {
    const collection = new ServiceCollection();
    collection.addScoped(Number);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]?.lifetime).toBe(ServiceLifetime.Scoped);
    expect(descriptors[0]?.service).toBe(Number);
    expect(descriptors[0]?.implementation).toBe(Number);
  });
  it("should register singleton service", () => {
    const collection = new ServiceCollection();
    collection.addSingleton(Number);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]?.lifetime).toBe(ServiceLifetime.Singleton);
    expect(descriptors[0]?.service).toBe(Number);
    expect(descriptors[0]?.implementation).toBe(Number);
  });
  it("should register transient service with factory", () => {
    const collection = new ServiceCollection();
    collection.addTransient(Number, () => 42);
    const descriptors = collection.getDescriptors(Number);
    expect((descriptors[0]?.implementation as any)()).toBe(42);
  });
  it("should register transient service with constructor", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addTransient(Number, Test);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register transient service with constructor as service and and implementation", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addTransient(Test);
    const descriptors = collection.getDescriptors(Test);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register singleton service with factory", () => {
    const collection = new ServiceCollection();
    collection.addSingleton(Number, () => 42);
    const descriptors = collection.getDescriptors(Number);
    expect((descriptors[0]?.implementation as any)()).toBe(42);
  });
  it("should register singleton service with constructor", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addSingleton(Number, Test);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register singleton service with constructor as service and and implementation", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addSingleton(Test);
    const descriptors = collection.getDescriptors(Test);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register scoped service with factory", () => {
    const collection = new ServiceCollection();
    collection.addScoped(Number, () => 42);
    const descriptors = collection.getDescriptors(Number);
    expect((descriptors[0]?.implementation as any)()).toBe(42);
  });
  it("should register scoped service with constructor", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addScoped(Number, Test);
    const descriptors = collection.getDescriptors(Number);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register scoped service with constructor as service and and implementation", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addScoped(Test);
    const descriptors = collection.getDescriptors(Test);
    expect(descriptors[0]?.implementation).toBe(Test);
  });
  it("should register multiple services", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addScoped(Number, Test);
    collection.addTransient(String, Test);
    collection.addSingleton(Test);
    const descriptors = Array.from(collection);
    expect(descriptors).toHaveLength(4);
  });
  it("should register multiple services of same type", () => {
    class Test {}
    const collection = new ServiceCollection();
    collection.addScoped(Test);
    collection.addTransient(Test);
    collection.addSingleton(Test);
    const descriptors = collection.getDescriptors(Test);
    expect(descriptors).toHaveLength(3);
  });
  it("should register multiple services of same type with different implementation", () => {
    class Type {}
    class Test1 {}
    class Test2 {}
    class Test3 {}
    const collection = new ServiceCollection();
    collection.addScoped(Type, Test1);
    collection.addTransient(Type, Test2);
    collection.addSingleton(Type, Test3);
    const descriptors = collection.getDescriptors(Type);
    expect(descriptors).toHaveLength(3);
  });
  it("should detect cyclic dependencies", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [Test2],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [Test1],
    });

    const collection = new ServiceCollection();
    collection.addScoped(Test1);
    expect(() => collection.addScoped(Test2)).toThrowError(
      "Cyclic dependency detected: Test2 -> Test1 -> Test2",
    );
  });
  it("should detect cyclic dependencies to itself", () => {
    class Test1 {}
    class Test2 {}
    ServiceRegistry.register(Test1, {
      name: Test1.name,
      dependencies: [Test2],
    });
    ServiceRegistry.register(Test2, {
      name: Test2.name,
      dependencies: [Test1],
    });

    const collection = new ServiceCollection();
    expect(() => collection.addScoped(Test1, Test2)).toThrowError(
      "Cyclic dependency detected: Test2 (Test1) -> Test2 (Test1)",
    );
  });
});
