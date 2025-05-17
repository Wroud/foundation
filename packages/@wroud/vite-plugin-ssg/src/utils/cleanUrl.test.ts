import { describe, it, expect } from "vitest";
import { cleanUrl } from "./cleanUrl.js";

describe("cleanUrl", () => {
  it("removes query strings and fragments", () => {
    expect(cleanUrl("/foo?bar#baz")).toBe("/foo");
    expect(cleanUrl("/foo?bar=baz")).toBe("/foo");
    expect(cleanUrl("/foo#section")).toBe("/foo");
  });

  it("returns null and undefined unchanged", () => {
    expect(cleanUrl(null)).toBeNull();
    expect(cleanUrl(undefined)).toBeUndefined();
  });
});
