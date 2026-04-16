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

  test("should correctly infer query parameter types", () => {
    type Params = ExtractRouteParams<"/user/:id?tab=:tab">;

    // tab should be optional (no ! suffix)
    const withTab: Params = { id: "42", tab: "settings" };
    const withoutTab: Params = { id: "42" };

    patternMatcher.addPattern("/user/:id?tab=:tab");
    const url = patternMatcher.encode("/user/:id?tab=:tab", withTab);
    expect(url).toBe("/user/42?tab=settings");

    const url2 = patternMatcher.encode("/user/:id?tab=:tab", withoutTab);
    expect(url2).toBe("/user/42");

    const params = patternMatcher.decode(
      "/user/:id?tab=:tab",
      "/user/42?tab=settings",
    );
    expect(params).toEqual({ id: "42", tab: "settings" });
  });

  test("should correctly infer typed query parameters", () => {
    type Params = ExtractRouteParams<"/search?q=:query&page=:page<number>">;

    // Both optional
    const searchParams: Params = { query: "hello", page: 3 };
    const partialParams: Params = { query: "hello" };

    patternMatcher.addPattern("/search?q=:query&page=:page<number>");
    const url = patternMatcher.encode(
      "/search?q=:query&page=:page<number>",
      searchParams,
    );
    expect(url).toBe("/search?q=hello&page=3");

    const url2 = patternMatcher.encode(
      "/search?q=:query&page=:page<number>",
      partialParams,
    );
    expect(url2).toBe("/search?q=hello");

    const params = patternMatcher.decode(
      "/search?q=:query&page=:page<number>",
      "/search?q=hello&page=3",
    );
    expect(params).toEqual({ query: "hello", page: 3 });
  });

  test("should correctly infer required query parameters with !", () => {
    type Params = ExtractRouteParams<"/search?q=:query!&page=:page<number>">;

    // q is required (has !), page is optional
    const full: Params = { query: "hello", page: 3 };
    const onlyRequired: Params = { query: "hello" };

    patternMatcher.addPattern("/search?q=:query!&page=:page<number>");
    const url = patternMatcher.encode(
      "/search?q=:query!&page=:page<number>",
      full,
    );
    expect(url).toBe("/search?q=hello&page=3");

    const url2 = patternMatcher.encode(
      "/search?q=:query!&page=:page<number>",
      onlyRequired,
    );
    expect(url2).toBe("/search?q=hello");

    // Required query param missing should throw
    expect(() =>
      patternMatcher.encode("/search?q=:query!&page=:page<number>", {} as any),
    ).toThrow("Missing required query parameter: query");
  });

  test("should correctly infer mixed path and query parameters with types", () => {
    type Params =
      ExtractRouteParams<"/blog/:category/:path*?sort=:sort&limit=:limit<number>">;

    // sort and limit are optional
    const mixedParams: Params = {
      category: "tech",
      path: ["2024", "intro"],
      sort: "date",
      limit: 10,
    };
    const minimalParams: Params = {
      category: "tech",
      path: ["2024", "intro"],
    };

    patternMatcher.addPattern(
      "/blog/:category/:path*?sort=:sort&limit=:limit<number>",
    );
    const url = patternMatcher.encode(
      "/blog/:category/:path*?sort=:sort&limit=:limit<number>",
      mixedParams,
    );
    expect(url).toBe("/blog/tech/2024/intro?sort=date&limit=10");

    const url2 = patternMatcher.encode(
      "/blog/:category/:path*?sort=:sort&limit=:limit<number>",
      minimalParams,
    );
    expect(url2).toBe("/blog/tech/2024/intro");

    const params = patternMatcher.decode(
      "/blog/:category/:path*?sort=:sort&limit=:limit<number>",
      "/blog/tech/2024/intro?sort=date&limit=10",
    );
    expect(params).toEqual({
      category: "tech",
      path: ["2024", "intro"],
      sort: "date",
      limit: 10,
    });
  });

  test("should infer empty params for static route with query params only", () => {
    type Params = ExtractRouteParams<"/search?q=:q">;

    // q is optional
    const params: Params = { q: "test" };
    const empty: Params = {};

    patternMatcher.addPattern("/search?q=:q");
    const url = patternMatcher.encode("/search?q=:q", params);
    expect(url).toBe("/search?q=test");

    const url2 = patternMatcher.encode("/search?q=:q", empty);
    expect(url2).toBe("/search");
  });
});
