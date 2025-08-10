import { expect, it, describe } from "vitest";
import { createService } from "./createService.js";

describe("createService", () => {
  it("has name", () => {
    expect(createService("name")).toHaveProperty("name", "name");
  });

  it("new call throws error", () => {
    const service = createService("name");
    expect(() => new service()).toThrowError("service is not a constructor");
  });

  it("call throws error", () => {
    const service = createService("name");
    expect(() => (service as any)()).toThrowError("is not a function");
  });
});
