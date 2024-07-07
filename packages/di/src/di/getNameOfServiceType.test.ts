import { describe, expect, it } from "vitest";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
import { createService } from "./createService.js";

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
    expect(getNameOfServiceType(service as any)).toBe("[object Object]");
  });
});
