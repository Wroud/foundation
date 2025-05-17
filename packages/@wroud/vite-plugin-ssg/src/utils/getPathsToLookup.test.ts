import { describe, it, expect } from "vitest";
import { getPathsToLookup } from "./getPathsToLookup.js";

describe("getPathsToLookup", () => {
  it("returns all paths to lookup from deepest to root", () => {
    const result = [...getPathsToLookup("foo/bar/baz")];
    expect(result).toEqual([
      "foo/bar/baz",
      "foo/bar/baz/index",
      "foo/bar",
      "foo/bar/index",
      "foo",
      "foo/index",
      "/index",
    ]);
  });
});
