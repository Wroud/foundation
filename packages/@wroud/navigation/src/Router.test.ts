import { describe, it, expect, beforeEach } from "vitest";
import { Router } from "./Router.js";
import { TriePatternMatching } from "./pattern-matching/TriePatternMatching.js";

function createPatternRouter(options?: { trailingSlash?: boolean }): Router {
  return new Router({
    matcher: new TriePatternMatching(options),
  });
}

describe("Router", () => {
  describe("Pattern-based routing", () => {
    let router: Router;

    beforeEach(() => {
      router = createPatternRouter({ trailingSlash: false });
    });

    describe("Route management", () => {
      it("should add and retrieve routes by ID", () => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users" });

        expect(router.getRoute("/")).toBeDefined();
        expect(router.getRoute("/app")).toBeDefined();
        expect(router.getRoute("/app/users")).toBeDefined();

        expect(router.getRoute("/not-added")).toBeUndefined();
      });

      it("should reject routes without an ID", () => {
        // @ts-expect-error - Testing runtime validation
        expect(() => router.addRoute({})).toThrow(/Route ID is required/);
      });

      it("should prevent duplicate routes with the same ID", () => {
        router.addRoute({ id: "/app" });

        expect(() => router.addRoute({ id: "/app" })).toThrow(/already exists/);
      });

      it("should provide access to all registered routes", () => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });

        const routes = router.routesList;

        expect(routes).toHaveLength(2);
        expect(routes.some((r) => r.id === "/")).toBe(true);
        expect(routes.some((r) => r.id === "/app")).toBe(true);
      });
    });

    describe("URL matching", () => {
      beforeEach(() => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users" });
        router.addRoute({ id: "/app/users/:id" });
      });

      it("should match URLs to their corresponding routes", () => {
        const rootMatch = router.matchUrl("/");
        expect(rootMatch?.id).toBe("/");
        expect(rootMatch?.params).toEqual({});

        const appMatch = router.matchUrl("/app");
        expect(appMatch?.id).toBe("/app");
        expect(appMatch?.params).toEqual({});

        const usersMatch = router.matchUrl("/app/users");
        expect(usersMatch?.id).toBe("/app/users");
        expect(usersMatch?.params).toEqual({});

        const userIdMatch = router.matchUrl("/app/users/123");
        expect(userIdMatch?.id).toBe("/app/users/:id");
        expect(userIdMatch?.params).toEqual({ id: "123" });
      });

      it("should return null for non-matching URLs", () => {
        const noMatch = router.matchUrl("/non-existent");
        expect(noMatch).toBeNull();

        const partialMatch = router.matchUrl("/app/non-existent");
        expect(partialMatch).toBeNull();
      });

      it("should match URLs regardless of trailing slashes", () => {
        const match1 = router.matchUrl("/app");
        expect(match1?.id).toBe("/app");

        const match2 = router.matchUrl("/app/");
        expect(match2?.id).toBe("/app");
      });
    });

    describe("URL building", () => {
      beforeEach(() => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users/:id" });
      });

      it("should build URLs from route IDs and parameters", () => {
        expect(router.buildUrl("/", {})).toBe("/");

        expect(router.buildUrl("/app", {})).toBe("/app");

        expect(router.buildUrl("/app/users/:id", { id: "123" })).toBe(
          "/app/users/123",
        );
      });

      it("should return null when building URL for non-existent route", () => {
        expect(router.buildUrl("/non-existent", {})).toBeNull();
      });

      it("should handle different parameter values correctly", () => {
        expect(router.buildUrl("/app/users/:id", { id: "123" })).toBe(
          "/app/users/123",
        );

        expect(router.buildUrl("/app/users/:id", { id: "john-doe" })).toBe(
          "/app/users/john-doe",
        );

        expect(
          router.buildUrl("/app/users/:id", { id: "user@example.com" }),
        ).toBe("/app/users/user@example.com");
      });
    });

    describe("Route hierarchy", () => {
      beforeEach(() => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users" });
        router.addRoute({ id: "/app/users/:id" });
      });

      it("should establish parent-child relationships based on URL structure", () => {
        const userIdRoute = router.getRoute("/app/users/:id");
        expect(userIdRoute).toBeDefined();

        if (userIdRoute) {
          expect(userIdRoute.parents).toContain("/");
          expect(userIdRoute.parents).toContain("/app");
          expect(userIdRoute.parents).toContain("/app/users");

          expect(userIdRoute.parents.length).toBe(3);
        }
      });

      it("should provide access to the immediate parent route", () => {
        const rootParent = router.getParentRoute("/");
        expect(rootParent).toBeUndefined();

        const appParent = router.getParentRoute("/app");
        expect(appParent?.id).toBe("/");

        const usersParent = router.getParentRoute("/app/users");
        expect(usersParent?.id).toBe("/app");
      });

      it("should return the full route ancestry", () => {
        const tree = router.getRouteTree("/app/users/:id");

        expect(tree).toHaveLength(4);

        const ids = tree.map((route) => route.id);
        expect(ids).toContain("/");
        expect(ids).toContain("/app");
        expect(ids).toContain("/app/users");
        expect(ids).toContain("/app/users/:id");
      });

      it("should throw when requesting a route tree for a non-existent route", () => {
        expect(() => router.getRouteTree("/non-existent")).toThrow(/not found/);
      });
    });

    describe("Route state conversion", () => {
      beforeEach(() => {
        router.addRoute({ id: "/" });
        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users/:id" });
      });

      it("should convert between route states and URLs", () => {
        const state = {
          id: "/app/users/:id",
          params: { id: "123" },
        };
        const url = router.stateToUrl(state);
        expect(url).toBe("/app/users/123");

        const parsedState = router.urlToState("/app/users/456");
        expect(parsedState?.id).toBe("/app/users/:id");
        expect(parsedState?.params).toEqual({ id: "456" });
      });

      it("should return null when converting invalid state to URL", () => {
        const invalidState = {
          id: "/non-existent",
          params: {},
        };
        expect(router.stateToUrl(invalidState)).toBeNull();
      });

      it("should return null when converting invalid URL to state", () => {
        expect(router.urlToState("/non-existent")).toBeNull();
      });
    });
  });

  describe("Routing configuration options", () => {
    describe("Custom route matcher", () => {
      it("should work with a custom matcher implementation", () => {
        const customMatcher = new TriePatternMatching({ trailingSlash: false });
        const router = new Router({ matcher: customMatcher });

        router.addRoute({ id: "/app" });
        router.addRoute({ id: "/app/users/:id" });

        expect(router.buildUrl("/app", {})).toBe("/app");
        expect(router.buildUrl("/app/users/:id", { id: "123" })).toBe(
          "/app/users/123",
        );

        const match = router.matchUrl("/app/users/456");
        expect(match?.id).toBe("/app/users/:id");
        expect(match?.params).toEqual({ id: "456" });
      });

      it("should gracefully handle operations when no matcher is provided", () => {
        const router = new Router();
        router.addRoute({ id: "/app" });

        expect(router.matchUrl("/app")).toBeNull();
        expect(router.buildUrl("/app", {})).toBeNull();
        expect(router.stateToUrl({ id: "/app", params: {} })).toBeNull();
        expect(router.urlToState("/app")).toBeNull();
      });
    });

    describe("TrailingSlash option", () => {
      it("should respect the trailingSlash option when building URLs", () => {
        const routerWithSlash = createPatternRouter({ trailingSlash: true });
        routerWithSlash.addRoute({ id: "/app" });
        routerWithSlash.addRoute({ id: "/app/users/:id" });

        const routerWithoutSlash = createPatternRouter({
          trailingSlash: false,
        });
        routerWithoutSlash.addRoute({ id: "/app" });
        routerWithoutSlash.addRoute({ id: "/app/users/:id" });

        expect(routerWithSlash.buildUrl("/app", {})).toBe("/app/");
        expect(routerWithSlash.buildUrl("/app/users/:id", { id: "123" })).toBe(
          "/app/users/123/",
        );

        expect(routerWithoutSlash.buildUrl("/app", {})).toBe("/app");
        expect(
          routerWithoutSlash.buildUrl("/app/users/:id", { id: "123" }),
        ).toBe("/app/users/123");
      });
    });
  });
});
