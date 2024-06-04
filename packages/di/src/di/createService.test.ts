import { expect, it, describe } from "@jest/globals";
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
    expect(() => (service as any)()).toThrowError(
      "Service type name can't be initiated",
    );
  });
});
