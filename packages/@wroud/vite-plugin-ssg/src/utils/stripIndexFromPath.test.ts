import { describe, it, expect } from "vitest";
import { stripIndexFromPath } from "./stripIndexFromPath.js";

describe("stripIndexFromPath", () => {
  it('should strip bare "index"', () => {
    expect(stripIndexFromPath("index")).toBe("");
  });

  it('should strip "/index"', () => {
    expect(stripIndexFromPath("/index")).toBe("/");
  });

  it('should strip "foo/index"', () => {
    expect(stripIndexFromPath("foo/index")).toBe("foo/");
  });

  it('should strip "foo/bar/index"', () => {
    expect(stripIndexFromPath("foo/bar/index")).toBe("foo/bar/");
  });

  it("should not strip index in the middle of a path", () => {
    expect(stripIndexFromPath("index/foo")).toBe("index/foo");
  });

  it("should not strip index as part of another name", () => {
    expect(stripIndexFromPath("indexPage")).toBe("indexPage");
    expect(stripIndexFromPath("foo/indexPage")).toBe("foo/indexPage");
  });

  it("should leave paths without index unchanged", () => {
    expect(stripIndexFromPath("foo/bar")).toBe("foo/bar");
    expect(stripIndexFromPath("")).toBe("");
    expect(stripIndexFromPath("/")).toBe("/");
  });
});
