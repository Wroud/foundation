import { describe, expect, it } from "vitest";
import { isOptionalDependency } from "./isOptionalDependency.js";
import { all, createService, optional, single } from "@wroud/di";

describe("isOptionalDependency", () => {
  it("should detect optional resolver", async () => {
    const service = createService("Service");
    expect(isOptionalDependency(optional(service))).toBe(true);
    expect(isOptionalDependency(single(service))).toBe(false);
    expect(isOptionalDependency(all(service))).toBe(false);
  });
  it("should detect optional resolver in combined resolver", async () => {
    const service = createService("Service");

    expect(isOptionalDependency(all(optional(service)))).toBe(true);
    expect(isOptionalDependency(optional(all(service)))).toBe(true);
  });
});
