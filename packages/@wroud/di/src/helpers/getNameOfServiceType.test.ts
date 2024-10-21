import { describe, expect, it } from "vitest";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
import { createService } from "../di/createService.js";

describe("getNameOfServiceType", () => {
  it("should return the correct name for a given class", () => {
    class Test {}
    expect(getNameOfServiceType(Test)).toBe("Test");
  });

  it("should return the correct name for a given service", () => {
    const service = createService("name");
    expect(getNameOfServiceType(service)).toBe("name");
  });

  it("should return the correct name for a given object", () => {
    const service = {};
    expect(getNameOfServiceType(service)).toBe("Object");
  });

  it("should return the correct name for a given object with name", () => {
    const service = { name: "service name" };
    expect(getNameOfServiceType(service)).toBe("service name");
  });

  it("should return the correct name for a given null", () => {
    expect(getNameOfServiceType(null)).toBe("null");
  });

  it("should return the correct name for a given anonymous function from var", () => {
    const service = () => {};
    expect(getNameOfServiceType(service)).toBe("service");
  });

  it("should return the correct name for a given anonymous function", () => {
    expect(getNameOfServiceType(() => {})).toBe("Function");
  });

  it("should return the correct name for a given named function", () => {
    const service = function Test() {};
    expect(getNameOfServiceType(service)).toBe("Test");
  });

  it("should return the correct name for a given implementation", () => {
    class Test {}
    expect(getNameOfServiceType(new Test())).toBe("Test");
  });

  it("should return the correct name for a given implementation with name", () => {
    class Test {
      name = "service name";
    }
    expect(getNameOfServiceType(new Test())).toBe("service name");
  });

  it("should return the correct name for a given implementation with constructor name", () => {
    class Test {
      constructor() {}
    }
    expect(getNameOfServiceType(new Test())).toBe("Test");
  });

  it("should return the correct name for a given implementation with prototype name", () => {
    class Test {}
    (Test.prototype as any).name = "service name";
    expect(getNameOfServiceType(new Test())).toBe("service name");
  });

  it("should return the correct name for a given implementation with prototype constructor name", () => {
    class Test {}
    (Test.prototype as any).constructor = { name: "service name" };
    expect(getNameOfServiceType(new Test())).toBe("service name");
  });

  it("should return the correct name for extended class with name", () => {
    class Test {}
    class Test2 extends Test {}
    expect(getNameOfServiceType(new Test2())).toBe("Test2");
  });

  it("should return the correct name for extended class without name from implementation", () => {
    class Test {}
    expect(getNameOfServiceType(new (class extends Test {})())).toBe("Test");
  });

  it("should return the correct name for extended class without name from var", () => {
    class Test {}
    const Test2 = class extends Test {};
    expect(getNameOfServiceType(Test2)).toBe("Test2");
  });

  it("should return the correct name for extended class without name", () => {
    class Test {}
    expect(getNameOfServiceType(class extends Test {})).toBe("Function");
  });
});
