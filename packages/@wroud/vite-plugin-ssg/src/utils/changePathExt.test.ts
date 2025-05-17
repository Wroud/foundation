import { describe, it, expect } from "vitest";
import { changePathExt } from "./changePathExt.js";

describe("changePathExt", () => {
  it("changes extension and preserves query", () => {
    expect(changePathExt("/foo/bar.txt", ".js")).toBe("/foo/bar.js");
    expect(changePathExt("/foo/bar.txt?raw", ".js")).toBe("/foo/bar.js?raw");
  });

  it("adds extension when none exists", () => {
    expect(changePathExt("/foo/bar", ".js")).toBe("/foo/bar.js");
    expect(changePathExt(".env", ".js")).toBe(".env.js");
  });
});
