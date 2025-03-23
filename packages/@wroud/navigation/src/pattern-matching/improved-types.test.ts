import { describe, test, expect } from "vitest";
import type { ExtractRouteParams } from "./types.js";
import { TriePatternMatching } from "./TriePatternMatching.js";

// These are type tests - they verify TypeScript type inference
// The focus is on ensuring types are correctly inferred and displayed
describe("Improved Type Representation", () => {
  test("type definitions should correctly extract route parameters", () => {
    // Simple parameter extraction - should result in a clean { id: string } type
    type UserParams = ExtractRouteParams<"/user/:id">;
    // Simple runtime confirmation
    const param1: UserParams = { id: "123" };
    expect(typeof param1.id).toBe("string");

    // Multiple parameters - should result in a clean object type, not a union
    type BlogParams = ExtractRouteParams<"/blog/:year/:month/:slug">;
    // Simple runtime confirmation
    const param2: BlogParams = {
      year: "2023",
      month: "05",
      slug: "hello-world",
    };
    expect(typeof param2.year).toBe("string");
    expect(typeof param2.month).toBe("string");
    expect(typeof param2.slug).toBe("string");

    // Wildcard parameters - should result in a clean { path: string[] } type
    type FilesParams = ExtractRouteParams<"/files/:path*">;
    // Simple runtime confirmation
    const param3: FilesParams = {
      path: ["documents", "report.pdf"],
    };
    expect(Array.isArray(param3.path)).toBe(true);

    // Mixed parameter types - should result in a clean object with mixed types
    type DocsParams = ExtractRouteParams<"/docs/:section/:path*/:revision">;
    // Simple runtime confirmation
    const param4: DocsParams = {
      section: "tutorial",
      path: ["intro", "getting-started"],
      revision: "latest",
    };
    expect(typeof param4.section).toBe("string");
    expect(Array.isArray(param4.path)).toBe(true);
    expect(typeof param4.revision).toBe("string");

    // Complex pattern - should still result in a clean object type
    type ComplexParams =
      ExtractRouteParams<"/api/:version/users/:id/posts/:year/:category*">;
    // Simple runtime confirmation
    const param5: ComplexParams = {
      version: "v1",
      id: "123",
      year: "2023",
      category: ["tech", "programming"],
    };
    expect(typeof param5.version).toBe("string");
    expect(typeof param5.id).toBe("string");
    expect(typeof param5.year).toBe("string");
    expect(Array.isArray(param5.category)).toBe(true);

    // Empty params - static route
    type EmptyParams = ExtractRouteParams<"/about">;
    // Simple runtime confirmation
    const param6: EmptyParams = {};
    expect(Object.keys(param6).length).toBe(0);

    // Root path - empty params
    type RootParams = ExtractRouteParams<"/">;
    // Simple runtime confirmation
    const param7: RootParams = {};
    expect(Object.keys(param7).length).toBe(0);
  });

  test("tooltip issue with function return types", () => {
    const router = new TriePatternMatching();
    router.addPattern("/user/:id");
    router.addPattern("/files/:path*");

    // TEST 1: Check direct decode result tooltips
    // The tooltip for this should show as { id: string } | null
    // not some internal type implementation
    const params1 = router.decode("/user/:id", "/user/123");
    if (params1) {
      // If you hover over params1.id in an IDE, it should show as string, not some complex type
      expect(typeof params1.id).toBe("string");
    }

    // TEST 2: Check return type for wildcard parameters
    // The tooltip for this should show as { path: string[] } | null
    // not ParamObject<"/files/:path*"> | null or similar
    const params2 = router.decode("/files/:path*", "/files/docs/readme.md");
    if (params2) {
      // If you hover over params2.path in an IDE, it should show as string[]
      expect(Array.isArray(params2.path)).toBe(true);
    }

    // TEST 3: Verify function parameter types in tooltips
    function processUserData(params: ExtractRouteParams<"/user/:id">) {
      // Tooltip here should show params as { id: string }, not a complex type
      return params.id;
    }

    if (params1) {
      const userId = processUserData(params1);
      expect(typeof userId).toBe("string");
    }

    // TEST 4: Assignment to intermediate variable with explicit type annotation
    // This is a good practice if you want to ensure clean tooltips in all contexts
    if (params2) {
      const fileParams: ExtractRouteParams<"/files/:path*"> = params2;
      // Tooltip should show a clean type here
      expect(Array.isArray(fileParams.path)).toBe(true);
    }
  });
});
