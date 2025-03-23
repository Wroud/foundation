import { describe, test, expect, beforeEach } from "vitest";
import { TriePatternMatching } from "./TriePatternMatching.js";
import type { ExtractRouteParams } from "./types.js";

// These tests verify TypeScript type inference; they will pass at runtime but the
// important verification happens at compile time in the TypeScript compiler

describe("Template Literal Types", () => {
  let patternMatcher: TriePatternMatching;

  beforeEach(() => {
    patternMatcher = new TriePatternMatching({ trailingSlash: false });
  });

  test("should correctly infer simple parameter types", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/user/:id">;

    // Should infer: { id: string }
    const userParams: Params = { id: "123" };

    // Runtime test
    patternMatcher.addPattern("/user/:id");
    const url = patternMatcher.encode("/user/:id", userParams);
    expect(url).toBe("/user/123");

    const params = patternMatcher.decode("/user/:id", "/user/123");
    expect(params).toEqual({ id: "123" });
  });

  test("should correctly infer multiple parameter types", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/blog/:year/:month/:day/:slug">;

    // Should infer: { year: string, month: string, day: string, slug: string }
    const blogParams: Params = {
      year: "2023",
      month: "05",
      day: "15",
      slug: "hello-world",
    };

    // Runtime test
    patternMatcher.addPattern("/blog/:year/:month/:day/:slug");
    const url = patternMatcher.encode(
      "/blog/:year/:month/:day/:slug",
      blogParams,
    );
    expect(url).toBe("/blog/2023/05/15/hello-world");

    const params = patternMatcher.decode(
      "/blog/:year/:month/:day/:slug",
      "/blog/2023/05/15/hello-world",
    );
    expect(params).toEqual({
      year: "2023",
      month: "05",
      day: "15",
      slug: "hello-world",
    });
  });

  test("should correctly infer wildcard parameter types", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/files/:path*">;

    // Should infer: { path: string[] }
    const wildcardParams: Params = {
      path: ["documents", "reports", "annual.pdf"],
    };

    // Runtime test
    patternMatcher.addPattern("/files/:path*");
    const url = patternMatcher.encode("/files/:path*", wildcardParams);
    expect(url).toBe("/files/documents/reports/annual.pdf");

    const params = patternMatcher.decode(
      "/files/:path*",
      "/files/documents/reports/annual.pdf",
    );
    expect(params).toEqual({
      path: ["documents", "reports", "annual.pdf"],
    });
  });

  test("should correctly infer mixed parameter types", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/docs/:section/:path*/edit">;

    // Should infer: { section: string, path: string[] }
    const mixedParams: Params = {
      section: "tutorials",
      path: ["beginner", "introduction"],
    };

    // Runtime test
    patternMatcher.addPattern("/docs/:section/:path*/edit");
    const url = patternMatcher.encode(
      "/docs/:section/:path*/edit",
      mixedParams,
    );
    expect(url).toBe("/docs/tutorials/beginner/introduction/edit");

    const params = patternMatcher.decode(
      "/docs/:section/:path*/edit",
      "/docs/tutorials/beginner/introduction/edit",
    );
    expect(params).toEqual({
      section: "tutorials",
      path: ["beginner", "introduction"],
    });
  });

  test("should handle empty params for static routes", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/about">;

    // Should infer: {}
    const emptyParams: Params = {};

    // Runtime test
    patternMatcher.addPattern("/about");
    const url = patternMatcher.encode("/about", emptyParams);
    expect(url).toBe("/about");

    const params = patternMatcher.decode("/about", "/about");
    expect(params).toEqual({});
  });

  test("should handle root path", () => {
    // Type inference test
    type Params = ExtractRouteParams<"/">;

    // Should infer: {}
    const rootParams: Params = {};

    // Runtime test - root path needs special handling
    patternMatcher.addPattern("/");
    const url = patternMatcher.encode("/", rootParams);
    expect(url).toBe("/");

    const params = patternMatcher.decode("/", "/");
    expect(params).toEqual({});
  });
});
