import { describe, it, expect } from "vitest";
import { withTrailingSlash } from "./withTrailingSlash.js";

describe("withTrailingSlash", () => {
  it("adds slash if missing", () => {
    expect(withTrailingSlash("/foo")).toBe("/foo/");
  });

  it("leaves existing slash intact", () => {
    expect(withTrailingSlash("/foo/")).toBe("/foo/");
  });
});
