import { describe, expect, it } from "vitest";
import { pathUrlWithBase } from "./pathUrlWithBase.js";

describe("pathUrlWithBase", () => {
  it("prefixes relative urls with the base", () => {
    expect(pathUrlWithBase("/app/", "assets/a.css")).toBe("/app/assets/a.css");
  });

  it("keeps root-relative urls when the base is a path", () => {
    expect(pathUrlWithBase("/app/", "/assets/a.css")).toBe("/assets/a.css");
  });

  it("resolves root-relative urls against an absolute base", () => {
    expect(pathUrlWithBase("https://cdn.test/app/", "/a.css")).toBe(
      "https://cdn.test/a.css",
    );
  });

  it("leaves data, blob and protocol-relative urls untouched", () => {
    const data = "data:image/svg+xml,%3csvg%3e%3c/svg%3e";
    expect(pathUrlWithBase("/app/", data)).toBe(data);
    expect(pathUrlWithBase("/", "blob:https://x.test/1")).toBe(
      "blob:https://x.test/1",
    );
    expect(pathUrlWithBase("/app/", "//cdn.test/a.js")).toBe("//cdn.test/a.js");
  });

  it("keeps foreign absolute urls", () => {
    expect(pathUrlWithBase("/app/", "https://cdn.test/a.js")).toBe(
      "https://cdn.test/a.js",
    );
  });

  it("passes undefined through", () => {
    expect(pathUrlWithBase("/app/", undefined)).toBeUndefined();
  });
});
