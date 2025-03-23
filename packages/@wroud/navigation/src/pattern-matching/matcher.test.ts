import { describe, test, expect } from "vitest";
import * as matcher from "./matcher.js";
import type { ExtendedMatchResult } from "./types.js";

describe("Matcher", () => {
  describe("sortMatchResults", () => {
    test("should correctly sort results with different pattern types", () => {
      // Create mock results with different types of patterns
      const results = [
        { matched: true, pattern: "/content/:path*/view", params: {} },
        { matched: true, pattern: "/content/:type/view", params: {} },
        { matched: true, pattern: "/content/article/view", params: {} },
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(results);

      // Static should be first, then parameter, then wildcard
      expect(sorted[0]!.pattern).toBe("/content/article/view");
      expect(sorted[1]!.pattern).toBe("/content/:type/view");
      expect(sorted[2]!.pattern).toBe("/content/:path*/view");
    });

    test("should handle empty result arrays", () => {
      // Test directly with an empty array
      const result = matcher.sortMatchResults([]);
      expect(result).toEqual([]);
    });

    test("should correctly sort patterns with and without wildcards", () => {
      // This test indirectly verifies the pattern type caching and analysis
      const results = [
        { matched: true, pattern: "/users/profile", params: {} },
        { matched: true, pattern: "/users/:id", params: {} },
        { matched: true, pattern: "/users/:path*", params: {} },
        { matched: true, pattern: undefined, params: {} },
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(results);

      // Static route should be first
      expect(sorted[0]!.pattern).toBe("/users/profile");

      // Parameter route should be second
      expect(sorted[1]!.pattern).toBe("/users/:id");

      // Wildcard route should be third
      expect(sorted[2]!.pattern).toBe("/users/:path*");

      // Undefined pattern should be last
      expect(sorted[3]!.pattern).toBeUndefined();
    });

    test("should handle pattern sorting with missing patterns", () => {
      // Create mock results with some missing patterns
      const mockResults = [
        { matched: true, pattern: "/test", params: {} },
        { matched: true, pattern: null, params: {} },
        { matched: true, pattern: "/other", params: {} },
      ] as any[];

      // Call the sort function directly
      const sorted = matcher.sortMatchResults(mockResults);

      // Patterns should be prioritized over non-patterns
      expect(sorted[0]!.pattern).not.toBeNull();
      expect(sorted[sorted.length - 1]!.pattern).toBeNull();
    });

    test("should sort single result arrays without changing them", () => {
      // Single result should be returned as-is
      const singleResult = [
        { matched: true, pattern: "/test", params: {} },
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(singleResult);
      expect(sorted).toBe(singleResult); // Same reference
    });

    test("should correctly prioritize static segments in wildcard routes", () => {
      // Test multiple patterns with different static segment counts
      const results = [
        { matched: true, pattern: "/api/:path*", params: {} },
        { matched: true, pattern: "/api/:version/:path*/data", params: {} },
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(results);

      // Should prioritize the pattern with more static segments
      expect(sorted[0]!.pattern).toBe("/api/:version/:path*/data");
      expect(sorted[1]!.pattern).toBe("/api/:path*");
    });
  });

  // Additional tests for internal pattern type analysis can be added here
  describe("Pattern type analysis", () => {
    // We can't test the non-exported functions directly, but we can test
    // their effects through the exported sortMatchResults function

    test("should prioritize patterns without parameters over those with parameters", () => {
      const results = [
        { matched: true, pattern: "/users/:id", params: {} },
        { matched: true, pattern: "/users/list", params: {} },
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(results);
      expect(sorted[0]!.pattern).toBe("/users/list");
    });

    test("should prioritize patterns with the most static segments", () => {
      const results = [
        { matched: true, pattern: "/api/v1/users/:id/profile", params: {} }, // 3 static segments
        { matched: true, pattern: "/api/v1/:resource/:id", params: {} }, // 2 static segments
      ] as ExtendedMatchResult[];

      const sorted = matcher.sortMatchResults(results);
      expect(sorted[0]!.pattern).toBe("/api/v1/users/:id/profile");
    });
  });
});
