import { describe, it, expect } from "vitest";
import { stripBase } from "./stripBase.js";

describe("stripBase", () => {
  it("returns root slash when path equals base", () => {
    expect(stripBase("/base", "/base")).toBe("/");
  });

  it("removes base prefix", () => {
    expect(stripBase("/base/foo", "/base")).toBe("/foo");
  });

  it("returns original path when no base", () => {
    expect(stripBase("/foo", "/base")).toBe("/foo");
  });
});
