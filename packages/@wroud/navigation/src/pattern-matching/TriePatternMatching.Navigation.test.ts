import { describe, test, beforeEach, vi, afterEach } from "vitest";
import { TriePatternMatching } from "./index.js";
import { Navigation } from "../Navigation.js";
import { Router } from "../Router.js";
import type { IPatternNavigation } from "./IPatternNavigation.js";

describe("TriePatternMatching.Navigation", () => {
  let navigation: IPatternNavigation<TriePatternMatching>;

  beforeEach(() => {
    var patternMatcher = new TriePatternMatching({ trailingSlash: false });
    var router = new Router({
      matcher: patternMatcher,
    });
    navigation = new Navigation(router);
    vi.restoreAllMocks(); // Restore all mocks before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Pattern registration and removal", () => {
    test("should add patterns", () => {
      const userIdRoute = "/user/:id";
      const settingsRoute = "/user/:id/settings";
      const productRoute = "/product/:category/:id";
      const editPostRoute = "/posts/:path*/edit";
      navigation.router.addRoute({
        id: userIdRoute,
      });
      navigation.router.addRoute({
        id: settingsRoute,
      });
      navigation.router.addRoute({
        id: productRoute,
      });
      navigation.router.addRoute({
        id: editPostRoute,
      });

      navigation.navigate({
        id: userIdRoute,
        //@ts-expect-error should error here
        params: {},
      });

      navigation.navigate({
        id: userIdRoute,
        params: { id: "42" },
      });
    });
  });
});
