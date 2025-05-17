import { describe, it, expect } from "vitest";
import { removeNoInlineQuery, isNoInlineId } from "./removeNoInlineQuery.js";

describe("removeNoInlineQuery", () => {
  it("removes ?no-inline query", () => {
    expect(removeNoInlineQuery("/foo.js?no-inline")).toBe("/foo.js");
    expect(removeNoInlineQuery("/foo.js?no-inline&v=1")).toBe("/foo.js?v=1");
  });

  it("detects no-inline id", () => {
    expect(isNoInlineId("/foo.js?no-inline")).toBe(true);
    expect(isNoInlineId("/foo.js?v=1")).toBe(false);
  });
});
