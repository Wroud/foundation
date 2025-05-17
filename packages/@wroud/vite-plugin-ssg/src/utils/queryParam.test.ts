import { describe, it, expect } from "vitest";
import { addQueryParam, parseQueryParams, removeQueryParam } from "./queryParam.js";

describe("queryParam utilities", () => {
  it("adds new parameter to url without query", () => {
    expect(addQueryParam("/foo", "a", "1")).toBe("/foo?a=1");
  });

  it("appends parameter to url with existing query", () => {
    expect(addQueryParam("/foo?b=2", "a", "1")).toBe("/foo?b=2&a=1");
  });

  it("updates existing parameter", () => {
    expect(addQueryParam("/foo?a=1", "a", "2")).toBe("/foo?a=2");
  });

  it("supports parameters without value", () => {
    expect(addQueryParam("/foo", "flag")).toBe("/foo?flag");
  });

  it("encodes parameter value", () => {
    expect(addQueryParam("/foo", "q", "a b")).toBe("/foo?q=a%20b");
  });

  it("parses query parameters", () => {
    expect(parseQueryParams("/foo?a=1&b=two&flag")).toEqual({
      a: "1",
      b: "two",
      flag: null,
    });
  });

  it("removes parameter", () => {
    expect(removeQueryParam("/foo?a=1&b=2", "a")).toBe("/foo?b=2");
  });

  it("removes last parameter and trailing question mark", () => {
    expect(removeQueryParam("/foo?a=1", "a")).toBe("/foo");
  });
});
