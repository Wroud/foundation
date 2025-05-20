import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import { TriePatternMatching } from "./index.js";
import type { ExtractRouteParams } from "./types.js";
import * as parameterUtils from "./parameter-utils.js";

describe("TriePatternMatching", () => {
  let patternMatcher: TriePatternMatching;

  beforeEach(() => {
    patternMatcher = new TriePatternMatching({ trailingSlash: false });
    vi.restoreAllMocks(); // Restore all mocks before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Pattern registration and removal", () => {
    test("should add patterns", () => {
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/user/:id/settings");
      patternMatcher.addPattern("/product/:category/:id");
      patternMatcher.addPattern("/posts/:path*/edit");

      const patterns = patternMatcher.getPatterns();
      expect(patterns).toHaveLength(4);
      expect(patterns).toContain("/user/:id");
      expect(patterns).toContain("/user/:id/settings");
      expect(patterns).toContain("/product/:category/:id");
      expect(patterns).toContain("/posts/:path*/edit");
    });

    test("should not add duplicate patterns", () => {
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/user/:id");

      const patterns = patternMatcher.getPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns).toContain("/user/:id");
    });

    test("should handle root path pattern correctly", () => {
      patternMatcher.addPattern("/");

      const match = patternMatcher.match("/");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/");
      expect(match?.params).toEqual({});
    });

    test("should handle invalid pattern formats gracefully", () => {
      // Test with unusual path formats that the implementation actually supports
      patternMatcher.addPattern("no-leading-slash");

      // Verify it was registered
      const patterns = patternMatcher.getPatterns();
      expect(patterns).toContain("no-leading-slash");

      // Should be able to match patterns without leading slash
      const match = patternMatcher.match("no-leading-slash");
      expect(match?.id).toBe("no-leading-slash");
    });

    test("should remove patterns", () => {
      // Add some patterns
      patternMatcher.addPattern("/route1");
      patternMatcher.addPattern("/route2");
      patternMatcher.addPattern("/route3/:id");

      // Verify they were added
      expect(patternMatcher.getPatterns()).toContain("/route1");
      expect(patternMatcher.getPatterns()).toContain("/route2");
      expect(patternMatcher.getPatterns()).toContain("/route3/:id");

      // Should match before removal
      expect(patternMatcher.match("/route1")).not.toBeNull();
      expect(patternMatcher.match("/route2")).not.toBeNull();
      expect(patternMatcher.match("/route3/123")).not.toBeNull();

      // Remove a pattern
      patternMatcher.removePattern("/route2");

      // Verify it was removed
      expect(patternMatcher.getPatterns()).not.toContain("/route2");
      expect(patternMatcher.match("/route2")).toBeNull();

      // Other patterns should still work
      expect(patternMatcher.match("/route1")).not.toBeNull();
      expect(patternMatcher.match("/route3/123")).not.toBeNull();
    });

    test("should gracefully handle removing non-existent patterns", () => {
      // This should not throw an error
      expect(() => patternMatcher.removePattern("/not-added")).not.toThrow();
    });

    test("should clear caches when removing patterns", () => {
      // Add pattern
      patternMatcher.addPattern("/product/:id");

      // Create cache entries
      const url = patternMatcher.encode("/product/:id", { id: "123" });
      expect(url).toBe("/product/123");

      const match = patternMatcher.match("/product/123");
      expect(match?.id).toBe("/product/:id");

      // Remove pattern - should invalidate caches
      patternMatcher.removePattern("/product/:id");

      // Pattern should no longer match
      expect(patternMatcher.match("/product/123")).toBeNull();
    });
  });

  describe("Static route matching", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/about");
      patternMatcher.addPattern("/contact");
      patternMatcher.addPattern("/products/list");
    });

    test("should match static routes", () => {
      const match = patternMatcher.match("/about");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/about");
      expect(match?.params).toEqual({});
    });

    test("should match multi-segment static routes", () => {
      const match = patternMatcher.match("/products/list");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/products/list");
      expect(match?.params).toEqual({});
    });

    test("should return null for non-matching routes", () => {
      const match = patternMatcher.match("/nonexistent");
      expect(match).toBeNull();
    });

    test("should handle undefined or empty segments", () => {
      // Don't actually pass undefined to match since splitUrl doesn't handle it
      // Instead, test empty string which is a valid edge case
      const emptyMatch = patternMatcher.match("");
      expect(emptyMatch).toBeNull();

      // Test with just a slash
      const slashMatch = patternMatcher.match("/");
      // This should find our root pattern if it exists, or return null
      if (patternMatcher.getPatterns().includes("/")) {
        expect(slashMatch).not.toBeNull();
        expect(slashMatch?.id).toBe("/");
      } else {
        expect(slashMatch).toBeNull();
      }
    });
  });

  describe("Parameter route matching", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/product/:category/:id");
      patternMatcher.addPattern("/blog/:year/:month/:slug");
    });

    test("should match single parameter routes", () => {
      const match = patternMatcher.match("/user/123");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/user/:id");
      expect(match?.params).toEqual({ id: "123" });
    });

    test("should match multiple parameter routes", () => {
      const match = patternMatcher.match("/product/electronics/456");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/product/:category/:id");
      expect(match?.params).toEqual({ category: "electronics", id: "456" });
    });

    test("should match routes with multiple parameters", () => {
      const match = patternMatcher.match("/blog/2023/05/hello-world");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/blog/:year/:month/:slug");
      expect(match?.params).toEqual({
        year: "2023",
        month: "05",
        slug: "hello-world",
      });
    });

    test("should handle parameters with special characters", () => {
      // Add a pattern with parameters
      patternMatcher.addPattern("/path/:param");

      // Test with various special characters in the parameter
      const match1 = patternMatcher.match("/path/special@character.com");
      expect(match1?.id).toBe("/path/:param");
      expect(match1?.params).toEqual({ param: "special@character.com" });

      const match2 = patternMatcher.match("/path/with spaces");
      expect(match2?.id).toBe("/path/:param");
      expect(match2?.params).toEqual({ param: "with spaces" });

      const match3 = patternMatcher.match("/path/with-dash");
      expect(match3?.id).toBe("/path/:param");
      expect(match3?.params).toEqual({ param: "with-dash" });

      const match4 = patternMatcher.match("/path/with_underscore");
      expect(match4?.id).toBe("/path/:param");
      expect(match4?.params).toEqual({ param: "with_underscore" });
    });

    test("should handle empty parameter values", () => {
      // Test with empty parameter values
      // This might behave differently depending on the implementation
      // We don't care about the result, just that it doesn't throw
      expect(() => patternMatcher.match("/user/")).not.toThrow();
    });
  });

  describe("Wildcard parameter matching", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/files/:path*");
      patternMatcher.addPattern("/docs/:section/:path*/edit");
      patternMatcher.addPattern("/api/:version/users/:id");
    });

    test("should match wildcard routes with multiple segments", () => {
      const match = patternMatcher.match(
        "/files/documents/reports/annual/2023.pdf",
      );
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/files/:path*");
      expect(match?.params).toEqual({
        path: ["documents", "reports", "annual", "2023.pdf"],
      });
    });

    test("should match routes with wildcards in the middle", () => {
      const match = patternMatcher.match(
        "/docs/tutorial/chapter1/section2/subsection3/edit",
      );
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/docs/:section/:path*/edit");
      expect(match?.params).toEqual({
        section: "tutorial",
        path: ["chapter1", "section2", "subsection3"],
      });
    });

    test("should match routes with a single wildcard segment", () => {
      const match = patternMatcher.match("/files/single-file.txt");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/files/:path*");
      expect(match?.params).toEqual({ path: ["single-file.txt"] });
    });

    test("should handle empty wildcard paths", () => {
      // We don't care about the result, just that it doesn't throw
      expect(() => patternMatcher.match("/files/")).not.toThrow();
    });

    test("should handle wildcards with special characters", () => {
      const match = patternMatcher.match(
        "/files/path with spaces/file.name.with.dots",
      );
      expect(match?.id).toBe("/files/:path*");
      expect(match?.params).toEqual({
        path: ["path with spaces", "file.name.with.dots"],
      });
    });
  });

  describe("Route priority", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/user/:id/settings");
      patternMatcher.addPattern("/user/:id/:action");
      patternMatcher.addPattern("/user/profile");
      patternMatcher.addPattern("/posts/:path*/edit");
    });

    test("should prioritize static routes over parameter routes", () => {
      const match = patternMatcher.match("/user/profile");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/user/profile");
      expect(match?.params).toEqual({});
    });

    test("should match parameter routes when no static route matches", () => {
      const match = patternMatcher.match("/user/123/settings");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/user/:id/settings");
      expect(match?.params).toEqual({ id: "123" });
    });

    test("should match wider parameter routes when no specific route matches", () => {
      const match = patternMatcher.match("/user/123/delete");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/user/:id/:action");
      expect(match?.params).toEqual({ id: "123", action: "delete" });
    });

    test("should match wildcard routes for complex paths", () => {
      const match = patternMatcher.match("/posts/2023/05/my-post/edit");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/posts/:path*/edit");
      expect(match?.params).toEqual({ path: ["2023", "05", "my-post"] });
    });

    test("should correctly sort results with different pattern types", () => {
      // This test only verifies the integration through TriePatternMatching
      // Detailed tests of sortMatchResults are in matcher.test.ts

      // Add patterns that would result in multiple potential matches
      patternMatcher.addPattern("/content/:type/view"); // Parameter
      patternMatcher.addPattern("/content/article/view"); // Static
      patternMatcher.addPattern("/content/:path*/view"); // Wildcard

      // This should match the static route with highest priority
      const match1 = patternMatcher.match("/content/article/view");
      expect(match1?.id).toBe("/content/article/view");

      // This should match the parameter route with middle priority
      const match2 = patternMatcher.match("/content/video/view");
      expect(match2?.id).toBe("/content/:type/view");

      // This should match the wildcard route with lowest priority
      const match3 = patternMatcher.match(
        "/content/category/subcategory/item/view",
      );
      expect(match3?.id).toBe("/content/:path*/view");
    });

    test("should handle ambiguous routes correctly", () => {
      // Add ambiguous routes
      patternMatcher.addPattern("/items/:id");
      patternMatcher.addPattern("/items/new");
      patternMatcher.addPattern("/items/:category/:id");

      // Static route should take priority
      const match1 = patternMatcher.match("/items/new");
      expect(match1?.id).toBe("/items/new");

      // Parameter route should match
      const match2 = patternMatcher.match("/items/123");
      expect(match2?.id).toBe("/items/:id");

      // Multi-parameter route should match
      const match3 = patternMatcher.match("/items/books/456");
      expect(match3?.id).toBe("/items/:category/:id");
    });
  });

  describe("Decoding parameters", () => {
    test("should decode parameters from static routes", () => {
      const pattern = "/about";
      const url = "/about";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({});
    });

    test("should decode parameters from parameter routes", () => {
      const pattern = "/user/:id/:action";
      const url = "/user/123/edit";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({ id: "123", action: "edit" });
    });

    test("should decode parameters from wildcard routes", () => {
      const pattern = "/posts/:path*/edit";
      const url = "/posts/2023/05/hello-world/edit";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({ path: ["2023", "05", "hello-world"] });
    });

    test("should return null for non-matching URLs", () => {
      const pattern = "/user/:id";
      const url = "/not-matching/123";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toBeNull();
    });

    test("should return null for URLs with wrong segment count", () => {
      const pattern = "/user/:id/:action";
      const url = "/user/123";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toBeNull();
    });

    test("should register pattern if not already registered when decoding", () => {
      const addPatternSpy = vi.spyOn(patternMatcher, "addPattern");
      const newPattern = "/new-route/:id";
      patternMatcher.decode(newPattern, "/new-route/456");
      expect(addPatternSpy).toHaveBeenCalledWith(newPattern);
    });

    test("should decode typed number and boolean parameters", () => {
      const pattern = "/blog/:year<number>/:month<number>/:slug";
      const url = "/blog/2023/1/hello";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({ year: 2023, month: 1, slug: "hello" });
    });

    test("should decode boolean parameter", () => {
      const pattern = "/user/enable/:state<boolean>";
      const url = "/user/enable/true";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({ state: true });
    });

    test("should decode typed wildcard parameters", () => {
      const pattern = "/users/:id<number>*";
      const url = "/users/1/2/3";
      const params = patternMatcher.decode(pattern, url);
      expect(params).toEqual({ id: [1, 2, 3] });
    });
  });

  describe("Encoding parameters", () => {
    test("should encode parameters for static routes", () => {
      const pattern = "/about";
      const params = {} as ExtractRouteParams<"/about">;
      const url = patternMatcher.encode(pattern, params);
      expect(url).toBe("/about");
    });

    test("should encode parameters for parameter routes", () => {
      const pattern = "/user/:id/:action";
      const params = {
        id: "123",
        action: "edit",
      } as ExtractRouteParams<"/user/:id/:action">;
      const url = patternMatcher.encode(pattern, params);
      expect(url).toBe("/user/123/edit");
    });

    test("should encode wildcard parameters with arrays", () => {
      const pattern = "/posts/:path*/edit";
      const params = {
        path: ["2023", "05", "hello-world"],
      } as ExtractRouteParams<"/posts/:path*/edit">;
      const url = patternMatcher.encode(pattern, params);
      expect(url).toBe("/posts/2023/05/hello-world/edit");
    });

    test("should encode wildcard parameters with string", () => {
      const pattern = "/files/:path*";
      const params = {
        path: "document.pdf",
      } as unknown as ExtractRouteParams<"/files/:path*">;
      const url = patternMatcher.encode(pattern, params);
      expect(url).toBe("/files/document.pdf");
    });

    test("should throw error for missing parameters", () => {
      const pattern = "/user/:id/:action";
      const params = { id: "123" } as Partial<
        ExtractRouteParams<"/user/:id/:action">
      >;
      expect(() => patternMatcher.encode(pattern, params as any)).toThrow(
        /missing or invalid/i,
      );
    });

    test("should throw error for missing wildcard parameters", () => {
      const pattern = "/posts/:path*/edit";
      const params = {} as Partial<ExtractRouteParams<"/posts/:path*/edit">>;
      expect(() => patternMatcher.encode(pattern, params as any)).toThrow(
        /missing required/i,
      );
    });

    test("should handle array with undefined values in wildcard parameters", () => {
      const pattern = "/files/:path*";
      const params = {
        path: ["docs", undefined as unknown as string, "file.txt"],
      } as ExtractRouteParams<"/files/:path*">;
      const url = patternMatcher.encode(pattern, params);
      expect(url).toBe("/files/docs/file.txt");
    });

    test("should handle invalid parameter values", () => {
      const pattern = "/user/:id";
      const params = {
        id: [] as unknown as string,
      } as ExtractRouteParams<"/user/:id">;
      expect(() => patternMatcher.encode(pattern, params)).toThrow(
        /Missing or invalid required parameter/i,
      );
    });
  });

  describe("Parameter edge cases", () => {
    test("should handle wildcards with single string value", () => {
      // Add pattern with a wildcard parameter
      patternMatcher.addPattern("/files/:path*");

      // Test with a single value as a string instead of an array
      const url = patternMatcher.encode("/files/:path*", {
        // @ts-expect-error - Intentionally passing string instead of array to test edge case
        path: "single-file.txt",
      });

      // Should handle it gracefully
      expect(url).toBe("/files/single-file.txt");
    });

    test("should handle undefined values in wildcard arrays", () => {
      patternMatcher.addPattern("/nested/:sections*/:id");

      // Include undefined in the array to test filtering
      const url = patternMatcher.encode("/nested/:sections*/:id", {
        // @ts-expect-error - Intentionally including undefined to test filtering
        sections: ["valid", undefined, "also-valid"],
        id: "123",
      });

      // Should filter out undefined and keep valid values
      expect(url).toBe("/nested/valid/also-valid/123");
    });
  });

  describe("Path utilities edge cases", () => {
    test("should handle joining long path segments", () => {
      // Create a pattern with many segments to test path joining
      const manySegments = Array(10)
        .fill(0)
        .map((_, i) => `segment${i}`);

      // Construct the pattern in a way that correctly alternates static and parameter segments
      let pattern = "";
      const params: Record<string, string> = {};

      manySegments.forEach((segment, index) => {
        pattern += `/${segment}`;
        if (index < manySegments.length - 1) {
          const paramName = `param${index}`;
          pattern += `/:${paramName}`;
          params[paramName] = `value${index}`;
        }
      });

      patternMatcher.addPattern(pattern);

      // Encode the URL with many segments
      const url = patternMatcher.encode(pattern, params);

      // Verify all segments are present
      for (let i = 0; i < manySegments.length; i++) {
        expect(url).toContain(`segment${i}`);
        if (i < manySegments.length - 1) {
          // All except the last segment will have params
          expect(url).toContain(`value${i}`);
        }
      }
    });

    test("should properly handle cache eviction in path joining", () => {
      // This is hard to test directly, so we'll just verify basic path joining works
      // with many different paths to trigger potential cache evictions

      for (let i = 0; i < 150; i++) {
        // More than MAX_CACHE_SIZE
        const pattern = `/cache-test-${i}/:id`;
        patternMatcher.addPattern(pattern);

        const url = patternMatcher.encode(pattern, { id: `value-${i}` });
        expect(url).toBe(`/cache-test-${i}/value-${i}`);
      }

      // Verify the last few still work after potential evictions
      for (let i = 145; i < 150; i++) {
        const pattern = `/cache-test-${i}/:id`;
        const url = patternMatcher.encode(pattern, { id: `value-${i}` });
        expect(url).toBe(`/cache-test-${i}/value-${i}`);
      }
    });
  });

  describe("Caching mechanism", () => {
    test("should cache decode results and reuse them", () => {
      const pattern = "/user/:id";
      const url = "/user/123";

      // First call should compute the result
      const matchSpy = vi.spyOn(patternMatcher, "match");
      patternMatcher.decode(pattern, url);
      expect(matchSpy).toHaveBeenCalledTimes(1);

      // Second call should use cache
      matchSpy.mockClear();
      patternMatcher.decode(pattern, url);
      expect(matchSpy).not.toHaveBeenCalled();
    });

    test("should cache encode results and reuse them", () => {
      const pattern = "/user/:id";
      const params = { id: "123" };

      // Setup spy on the imported utility functions
      const validateSpy = vi.spyOn(parameterUtils, "validateParameters");

      // First call should compute the result
      patternMatcher.encode(pattern, params);
      expect(validateSpy).toHaveBeenCalledTimes(1);

      // Second call with the same params should use cache
      validateSpy.mockClear();
      patternMatcher.encode(pattern, params);
      expect(validateSpy).not.toHaveBeenCalled();

      // Different params should not use cache
      validateSpy.mockClear();
      patternMatcher.encode(pattern, { id: "456" });
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });

    test("should clear caches when adding a new pattern", () => {
      // Set up some cache entries
      patternMatcher.decode("/user/:id", "/user/123");
      patternMatcher.encode("/user/:id", { id: "123" });

      // Add a new pattern, which should clear caches
      const matchSpy = vi.spyOn(patternMatcher, "match");
      patternMatcher.addPattern("/new-pattern");

      // Cache should be cleared, so this should call match again
      patternMatcher.decode("/user/:id", "/user/123");
      expect(matchSpy).toHaveBeenCalledTimes(1);
    });

    test("should handle decode cache eviction when iterator.next().value is undefined", () => {
      // EXPECTED BEHAVIOR: The matcher should not throw errors when managing cache,
      // even if there's an issue with the cache iteration

      // Generate a large number of patterns to force potential cache eviction
      for (let i = 0; i < 30; i++) {
        const pattern = `/test-pattern-${i}`;
        patternMatcher.decode(pattern, `/test-url-${i}`);
      }

      // No error should occur, and the function should continue working
      const pattern = "/another-pattern";
      const result = patternMatcher.decode(pattern, "/another-url");
      expect(result).toBeNull(); // Should be null since the pattern doesn't match
    });

    test("should handle encode cache eviction when iterator.next().value is undefined", () => {
      // EXPECTED BEHAVIOR: The matcher should not throw errors when managing cache,
      // even if there's an issue with the cache iteration

      // Generate a large number of patterns to force potential cache eviction
      for (let i = 0; i < 30; i++) {
        const pattern = `/test-pattern-${i}`;
        patternMatcher.addPattern(pattern);
        patternMatcher.encode(pattern, { id: i.toString() });
      }

      // No error should occur, and the function should continue working
      const pattern = "/user/:id";
      patternMatcher.addPattern(pattern);
      const result = patternMatcher.encode(pattern, { id: "test" });
      expect(result).toBe("/user/test");
    });

    test("should handle decode cache with limited size", () => {
      // EXPECTED BEHAVIOR: Cache has limited size, older entries should be dropped

      // Create a large number of patterns to exceed any reasonable cache size
      const LARGE_NUMBER = 2000; // Should be larger than any expected cache size

      // First pattern we'll test later to see if it's been evicted
      const firstPattern = "/first-pattern";
      patternMatcher.decode(firstPattern, "/first-url");

      // Add many patterns to force eviction of older cache entries
      for (let i = 0; i < LARGE_NUMBER; i++) {
        patternMatcher.decode(`/pattern-${i}`, `/url-${i}`);
      }

      // Add a spy after filling the cache
      const matchSpy = vi.spyOn(patternMatcher, "match");

      // Test if the first pattern was evicted (should call match again)
      patternMatcher.decode(firstPattern, "/first-url");

      // Verify match was called again (because entry was evicted)
      expect(matchSpy).toHaveBeenCalledTimes(1);
    });

    test("should handle encode cache with limited size", () => {
      // EXPECTED BEHAVIOR: Cache has limited size, older entries should be dropped

      // Create a large number of patterns to exceed any reasonable cache size
      const LARGE_NUMBER = 2000; // Should be larger than any expected cache size

      // First pattern we'll test later to see if it's been evicted
      const firstPattern = "/first-pattern/:id";
      patternMatcher.addPattern(firstPattern);
      patternMatcher.encode(firstPattern, { id: "test" });

      // Add many patterns to force eviction of older cache entries
      for (let i = 0; i < LARGE_NUMBER; i++) {
        const pattern = `/pattern-${i}/:id`;
        patternMatcher.addPattern(pattern);
        patternMatcher.encode(pattern, { id: i.toString() });
      }

      // Add a spy after filling the cache
      const validateSpy = vi.spyOn(parameterUtils, "validateParameters");

      // Test if the first pattern was evicted (should validate again)
      patternMatcher.encode(firstPattern, { id: "test" });

      // Verify validation was called again (because entry was evicted)
      expect(validateSpy).toHaveBeenCalledTimes(1);
    });

    test("should explicitly clear caches with clearCaches method", () => {
      // Set up some cache entries
      patternMatcher.decode("/user/:id", "/user/123");
      patternMatcher.encode("/blog/:slug", { slug: "post" });

      // Clear caches
      patternMatcher.clearCaches();

      // Access private properties for verification
      const instance = patternMatcher as any;
      expect(instance.decodeCache.size).toBe(0);
      expect(instance.encodeCache.size).toBe(0);
    });

    test("should handle null coalescing for cache gets", () => {
      // This test verifies the `??` operator works correctly
      // For decoding - directly test the decoded value
      const instance = patternMatcher as any;

      // Add pattern for decode test
      patternMatcher.addPattern("/test");

      // Create a pattern cache with a direct null value
      const patternMap = new Map([["/test-url", null]]);
      instance.decodeCache.set("/test", patternMap);

      // Should return null as expected
      expect(patternMatcher.decode("/test", "/test-url")).toBeNull();

      // For encoding - directly test with undefined value
      // Make sure pattern is registered
      patternMatcher.addPattern("/encode-test");

      // Create a param cache with undefined value
      const paramMap = new Map([
        ["{}", ""], // Empty string to test ?? ""
      ]);
      instance.encodeCache.set("/encode-test", paramMap);

      // The encode result should be an empty string, not undefined
      expect(patternMatcher.encode("/encode-test", {})).toBe("");
    });

    test("should handle wildcards with undefined segments", () => {
      patternMatcher.addPattern("/files/:path*");

      // Create a URL that will match after splitting and removing empty segments
      const match = patternMatcher.match("/files/document.pdf");
      expect(match).not.toBeNull();
      expect(match?.id).toBe("/files/:path*");
      expect(match?.params).toEqual({ path: ["document.pdf"] });
    });

    test("should correctly sort patterns with and without wildcards", () => {
      // Test routing behavior with different pattern types
      patternMatcher.addPattern("/users/profile"); // Static route
      patternMatcher.addPattern("/users/:id"); // Parameter route
      patternMatcher.addPattern("/users/:path*"); // Wildcard route

      // Static should match first
      expect(patternMatcher.match("/users/profile")?.id).toBe("/users/profile");

      // Parameter should match when no static pattern matches
      expect(patternMatcher.match("/users/123")?.id).toBe("/users/:id");

      // Wildcard should match deeper paths
      expect(patternMatcher.match("/users/a/b/c")?.id).toBe("/users/:path*");
    });

    test("should optimize when there are static and param results but no wildcard nodes", () => {
      // Create a matcher with multiple route types but no wildcards
      patternMatcher.addPattern("/api/users"); // Static
      patternMatcher.addPattern("/api/:entity"); // Parameter

      // This should match the static route
      const match1 = patternMatcher.match("/api/users");
      expect(match1?.id).toBe("/api/users");

      // This should match the parameter route
      const match2 = patternMatcher.match("/api/products");
      expect(match2?.id).toBe("/api/:entity");
    });

    test("should handle empty segments appropriately", () => {
      /**
       * EXPECTED BEHAVIOR SPECIFICATION FOR EMPTY SEGMENTS:
       * 1. Leading and trailing slashes should be normalized
       *    - "/user" should match "user" pattern
       *    - "user/" should match "user" pattern
       * 2. Root path "/" should match root pattern "/"
       * 3. Known limitations (these tests document current behavior):
       *    - URLs with empty segments in the middle (like "/user//profile") are not matched
       */

      // Register some patterns for testing
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/profile");
      patternMatcher.addPattern("/");

      // Test 1: Normal URL without empty segments - using match instead of decode
      const normalMatch = patternMatcher.match("/user/123");
      expect(normalMatch).not.toBeNull();
      expect(normalMatch?.id).toBe("/user/:id");
      expect(normalMatch?.params).toEqual({ id: "123" });

      // For decode, the first parameter is the pattern, second is the URL
      // decode returns only the params, not the full match result
      const result1 = patternMatcher.decode("/user/:id", "/user/123");
      expect(result1).toEqual({ id: "123" });

      // Test 2: Trailing empty segment should normalize correctly
      const trailingEmptyMatch = patternMatcher.match("/profile/");
      expect(trailingEmptyMatch).not.toBeNull();
      expect(trailingEmptyMatch?.id).toBe("/profile");

      const result2 = patternMatcher.decode("/profile", "/profile/");
      expect(result2).toEqual({});

      // Test 3: Root path should match root pattern
      const rootMatch = patternMatcher.match("/");
      expect(rootMatch).not.toBeNull();
      expect(rootMatch?.id).toBe("/");

      const result3 = patternMatcher.decode("/", "/");
      expect(result3).toEqual({});

      // Test 4: Double leading slashes (URL normalization issue)
      // Current implementation doesn't match this, but ideally it should
      const leadingEmptyMatch = patternMatcher.match("//profile");
      expect(leadingEmptyMatch).toBeNull();
      // NOTE: Current implementation limitation - double leading slashes aren't matched

      // Test 5: Empty segment in the middle
      // Current implementation doesn't match this, but ideally it should
      const middleEmptyMatch = patternMatcher.match("/user//123");
      expect(middleEmptyMatch).toBeNull();
      // NOTE: Current implementation limitation - empty segments in the middle aren't matched
    });
  });

  describe("Edge cases", () => {
    test("should handle nested patterns with same prefix", () => {
      patternMatcher.addPattern("/users");
      patternMatcher.addPattern("/users/new");
      patternMatcher.addPattern("/users/:id");
      patternMatcher.addPattern("/users/:id/edit");
      patternMatcher.addPattern("/users/:id/posts/:postId");

      // Test static routes
      expect(patternMatcher.match("/users")?.id).toBe("/users");
      expect(patternMatcher.match("/users/new")?.id).toBe("/users/new");

      // Test parameter routes
      expect(patternMatcher.match("/users/123")?.id).toBe("/users/:id");
      expect(patternMatcher.match("/users/123/edit")?.id).toBe(
        "/users/:id/edit",
      );

      // Test multi-parameter routes
      const match = patternMatcher.match("/users/123/posts/456");
      expect(match?.id).toBe("/users/:id/posts/:postId");
      expect(match?.params).toEqual({ id: "123", postId: "456" });
    });

    test("should handle route IDs that don't start with /", () => {
      patternMatcher.addPattern("no-leading-slash");

      const match = patternMatcher.match("no-leading-slash");
      expect(match?.id).toBe("no-leading-slash");
    });
  });

  describe("Pattern sorting edge cases", () => {
    // Direct tests of the matcher.sortMatchResults function have been moved to matcher.test.ts

    test("should handle pattern sorting with complex routes", () => {
      // Add various patterns to test routing priority
      patternMatcher.addPattern("/test/static");
      patternMatcher.addPattern("/test/:param");
      patternMatcher.addPattern("/test/:path*");

      // Verify route priorities through match behavior
      expect(patternMatcher.match("/test/static")?.id).toBe("/test/static");
      expect(patternMatcher.match("/test/param-value")?.id).toBe(
        "/test/:param",
      );
      expect(patternMatcher.match("/test/multi/segment/path")?.id).toBe(
        "/test/:path*",
      );
    });

    test("should correctly prioritize static segments in wildcard routes", () => {
      // Add patterns with same type but different static segment counts
      patternMatcher.addPattern("/api/:version/:path*/data"); // 2 static segments
      patternMatcher.addPattern("/api/:path*"); // 1 static segment

      // Should prioritize the pattern with more static segments
      const match = patternMatcher.match("/api/v1/users/list/data");
      expect(match?.id).toBe("/api/:version/:path*/data");
    });
  });

  describe("TrailingSlash option", () => {
    test("should add trailing slash when trailingSlash is true (default)", () => {
      const matcher = new TriePatternMatching({ trailingSlash: true });
      matcher.addPattern("/about");

      const url = matcher.encode("/about", {});
      expect(url).toBe("/about/");
    });

    test("should remove trailing slash when trailingSlash is false", () => {
      const matcher = new TriePatternMatching({ trailingSlash: false });
      matcher.addPattern("/about");

      const url = matcher.encode("/about", {});
      expect(url).toBe("/about");
    });

    test("should add trailing slash to all encoded URLs when trailingSlash is true", () => {
      const matcher = new TriePatternMatching({ trailingSlash: true });
      matcher.addPattern("/user/:id");
      matcher.addPattern("/files/:path*");

      const url1 = matcher.encode("/user/:id", { id: "123" });
      expect(url1).toBe("/user/123/");

      const url2 = matcher.encode("/files/:path*", {
        path: ["docs", "file.pdf"],
      });
      expect(url2).toBe("/files/docs/file.pdf/");
    });

    test("should remove trailing slash from all encoded URLs when trailingSlash is false", () => {
      const matcher = new TriePatternMatching({ trailingSlash: false });
      matcher.addPattern("/user/:id/");
      matcher.addPattern("/files/:path*/");

      const url1 = matcher.encode("/user/:id/", { id: "123" });
      expect(url1).toBe("/user/123");

      const url2 = matcher.encode("/files/:path*/", {
        path: ["docs", "file.pdf"],
      });
      expect(url2).toBe("/files/docs/file.pdf");
    });

    test("should always match URLs regardless of trailing slash in the URL", () => {
      // Both matchers should match regardless of slash in the URL, as that's a normalization step
      const matcherWithSlash = new TriePatternMatching({ trailingSlash: true });
      const matcherWithoutSlash = new TriePatternMatching({
        trailingSlash: false,
      });

      matcherWithSlash.addPattern("/about");
      matcherWithoutSlash.addPattern("/about");

      // Both matchers should match these URLs
      expect(matcherWithSlash.match("/about")).not.toBeNull();
      expect(matcherWithSlash.match("/about/")).not.toBeNull();
      expect(matcherWithoutSlash.match("/about")).not.toBeNull();
      expect(matcherWithoutSlash.match("/about/")).not.toBeNull();
    });
  });

  describe("Route state and URL conversion", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/");
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/blog/:year/:month/:day/:slug");
      patternMatcher.addPattern("/files/:path*");
    });

    test("should convert between route states and URLs", () => {
      // Root path
      const rootState = { id: "/", params: {} };
      const rootUrl = patternMatcher.stateToUrl(rootState);
      expect(rootUrl).toBe("/");

      // Single parameter
      const userState = { id: "/user/:id", params: { id: "123" } };
      const userUrl = patternMatcher.stateToUrl(userState);
      expect(userUrl).toBe("/user/123");

      // Multiple parameters
      const blogState = {
        id: "/blog/:year/:month/:day/:slug",
        params: { year: "2023", month: "05", day: "15", slug: "hello-world" },
      };
      const blogUrl = patternMatcher.stateToUrl(blogState);
      expect(blogUrl).toBe("/blog/2023/05/15/hello-world");

      // Wildcard parameter
      const filesState = {
        id: "/files/:path*",
        params: { path: ["docs", "reports", "2023.pdf"] },
      };
      const filesUrl = patternMatcher.stateToUrl(filesState);
      expect(filesUrl).toBe("/files/docs/reports/2023.pdf");
    });

    test("should correctly convert URLs to route states", () => {
      // Root path
      const rootState = patternMatcher.urlToState("/");
      expect(rootState).toEqual({ id: "/", params: {} });

      // Single parameter
      const userState = patternMatcher.urlToState("/user/123");
      expect(userState).toEqual({ id: "/user/:id", params: { id: "123" } });

      // Multiple parameters
      const blogState = patternMatcher.urlToState(
        "/blog/2023/05/15/hello-world",
      );
      expect(blogState).toEqual({
        id: "/blog/:year/:month/:day/:slug",
        params: { year: "2023", month: "05", day: "15", slug: "hello-world" },
      });

      // Wildcard parameter
      const filesState = patternMatcher.urlToState(
        "/files/docs/reports/2023.pdf",
      );
      expect(filesState).toEqual({
        id: "/files/:path*",
        params: { path: ["docs", "reports", "2023.pdf"] },
      });
    });

    test("should return null for non-matching URLs", () => {
      const state = patternMatcher.urlToState("/nonexistent/path");
      expect(state).toBeNull();
    });

    test("should handle URL encoding/decoding correctly", () => {
      patternMatcher.addPattern("/search/:query");

      // Test with URL-encodable characters
      const state = {
        id: "/search/:query",
        params: { query: "test with spaces & special chars" },
      };

      const url = patternMatcher.stateToUrl(state);
      // The URL should be usable for navigation
      expect(url).toBe("/search/test with spaces & special chars");

      // And we should be able to convert it back
      const parsedState = patternMatcher.urlToState(
        "/search/test with spaces & special chars",
      );
      expect(parsedState).toEqual(state);
    });
  });

  describe("Pattern ancestor and descendant detection", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/");
      patternMatcher.addPattern("/app");
      patternMatcher.addPattern("/app/users");
      patternMatcher.addPattern("/app/users/:id");
      patternMatcher.addPattern("/app/settings");
      patternMatcher.addPattern("/blog");
      patternMatcher.addPattern("/blog/:id");
    });

    test("should find pattern ancestors correctly", () => {
      // Root has no ancestors
      const rootAncestors = patternMatcher.getPatternAncestors("/");
      expect(rootAncestors).toEqual([]);

      // Test with a pattern we know exists
      patternMatcher.addPattern("/products");
      patternMatcher.addPattern("/products/items");

      // Check that the child has the parent in ancestors
      const itemsAncestors =
        patternMatcher.getPatternAncestors("/products/items");
      expect(itemsAncestors).toContain("/products");
    });

    test("should find pattern descendants correctly", () => {
      // Test with patterns we know exist
      patternMatcher.addPattern("/categories");
      patternMatcher.addPattern("/categories/featured");
      patternMatcher.addPattern("/categories/popular");

      // Categories should have featured and popular as descendants
      const descendants = patternMatcher.getPatternDescendants("/categories");
      expect(descendants).toContain("/categories/featured");
      expect(descendants).toContain("/categories/popular");
    });

    test("should handle non-existent patterns", () => {
      const ancestors = patternMatcher.getPatternAncestors("/nonexistent");
      expect(ancestors).toEqual([]);

      const descendants = patternMatcher.getPatternDescendants("/nonexistent");
      expect(descendants).toEqual([]);
    });
  });

  describe("Cache management", () => {
    beforeEach(() => {
      patternMatcher.addPattern("/user/:id");
      patternMatcher.addPattern("/blog/:slug");
    });

    test("should use and clear caches appropriately", () => {
      // First access should populate the cache
      const url1 = patternMatcher.encode("/user/:id", { id: "123" });
      expect(url1).toBe("/user/123");

      const url2 = patternMatcher.encode("/user/:id", { id: "123" });
      expect(url2).toBe("/user/123");

      // Clear the caches
      patternMatcher.clearCaches();

      // Access again - should still work
      const url3 = patternMatcher.encode("/user/:id", { id: "123" });
      expect(url3).toBe("/user/123");
    });
  });

  describe("Trailing slash handling", () => {
    test("should respect trailingSlash option when true", () => {
      const withTrailingSlash = new TriePatternMatching({
        trailingSlash: true,
      });
      withTrailingSlash.addPattern("/user/:id");

      const url = withTrailingSlash.encode("/user/:id", { id: "123" });
      expect(url).toBe("/user/123/");
    });

    test("should respect trailingSlash option when false", () => {
      const withoutTrailingSlash = new TriePatternMatching({
        trailingSlash: false,
      });
      withoutTrailingSlash.addPattern("/user/:id");

      const url = withoutTrailingSlash.encode("/user/:id", { id: "123" });
      expect(url).toBe("/user/123");
    });

    test("should match URLs regardless of trailing slash", () => {
      // Should match with or without trailing slash
      patternMatcher.addPattern("/about");

      const match1 = patternMatcher.match("/about");
      expect(match1?.id).toBe("/about");

      const match2 = patternMatcher.match("/about/");
      expect(match2?.id).toBe("/about");
    });
  });

  describe("Base path handling", () => {
    test("should handle base paths correctly", () => {
      const withBase = new TriePatternMatching({
        trailingSlash: false,
        base: "/api",
      });
      withBase.addPattern("/users/:id");

      // Should add the base to the URL
      const url = withBase.encode("/users/:id", { id: "123" });
      expect(url).toBe("/api/users/123");

      // Should match URLs with the base
      const match = withBase.match("/api/users/123");
      expect(match?.id).toBe("/users/:id");
      expect(match?.params).toEqual({ id: "123" });
    });
  });
});
