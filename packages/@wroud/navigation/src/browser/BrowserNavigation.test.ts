import { describe, it, expect, afterEach, vi } from "vitest";
import { Navigation } from "../Navigation.js";
import { Router } from "../Router.js";
import { TriePatternMatching } from "../pattern-matching/TriePatternMatching.js";
import { BrowserNavigation } from "./BrowserNavigation.js";

function createNavigation() {
  const router = new Router({
    matcher: new TriePatternMatching({ trailingSlash: false }),
  });
  return new Navigation(router);
}

function setupBrowserMocks(initialPath = "/") {
  const listeners: Record<string, Function[]> = {};

  const historyStack: Array<{ state: unknown; url: string }> = [
    { state: null, url: initialPath },
  ];
  let historyIndex = 0;

  const mockLocation = {
    get pathname() {
      const url = historyStack[historyIndex]!.url;
      const qIndex = url.indexOf("?");
      return qIndex >= 0 ? url.slice(0, qIndex) : url;
    },
    get search() {
      const url = historyStack[historyIndex]!.url;
      const qIndex = url.indexOf("?");
      return qIndex >= 0 ? url.slice(qIndex) : "";
    },
  };

  const mockHistory = {
    pushState: vi.fn((state: unknown, _title: string, url?: string | null) => {
      historyStack.splice(historyIndex + 1);
      historyStack.push({ state, url: url ?? mockLocation.pathname });
      historyIndex++;
    }),
    replaceState: vi.fn(
      (state: unknown, _title: string, url?: string | null) => {
        historyStack[historyIndex] = {
          state,
          url: url ?? mockLocation.pathname,
        };
      },
    ),
    back: vi.fn(() => {
      if (historyIndex > 0) {
        historyIndex--;
        const handler = listeners["popstate"]?.[0];
        if (handler) handler();
      }
    }),
    forward: vi.fn(() => {
      if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const handler = listeners["popstate"]?.[0];
        if (handler) handler();
      }
    }),
  };

  const mockWindow = {
    addEventListener: vi.fn((event: string, handler: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      const arr = listeners[event];
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }),
    location: mockLocation,
    history: mockHistory,
  };

  vi.stubGlobal("window", mockWindow);

  return {
    history: mockHistory,
    location: mockLocation,
    firePopState: () => {
      for (const handler of listeners["popstate"] || []) {
        handler();
      }
    },
    getHistoryStack: () => [...historyStack],
    getHistoryIndex: () => historyIndex,
    setUrl: (url: string) => {
      historyStack[historyIndex] = {
        state: historyStack[historyIndex]!.state,
        url,
      };
    },
  };
}

describe("BrowserNavigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("handleNavigation URL-aware push/replace", () => {
    it("should use replaceState when navigating to the same URL (popstate)", async () => {
      const mocks = setupBrowserMocks("/dashboard");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/dashboard" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      // Clear calls from registerRoutes
      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Simulate popstate to /dashboard (URL is already /dashboard)
      mocks.firePopState();

      // Wait for async popStateHandler
      await new Promise((r) => setTimeout(r, 0));

      // Should use replaceState since URL is already /dashboard
      expect(mocks.history.replaceState).toHaveBeenCalled();
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });

    it("should use pushState when navigating to a different URL", async () => {
      const mocks = setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/dashboard" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Programmatic navigation to a different URL
      await navigation.navigate({ id: "/dashboard", params: {} });

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { id: "/dashboard", params: {} },
        "",
        "/dashboard",
      );
    });

    it("should update browser URL when a route guard redirects during popstate", async () => {
      const mocks = setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/login" });
      navigation.router.addRoute({
        id: "/dashboard",
        canActivate: async () => {
          // Redirect to login
          await navigation.navigate({ id: "/login", params: {} });
          return false;
        },
      });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Simulate popstate to /dashboard (e.g., browser back/forward)
      mocks.setUrl("/dashboard");
      mocks.firePopState();

      // Wait for async handlers
      await new Promise((r) => setTimeout(r, 0));

      // The redirect to /login should have called pushState with /login
      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { id: "/login", params: {} },
        "",
        "/login",
      );

      // The current navigation state should be login
      expect(navigation.state).toEqual({ id: "/login", params: {} });
    });

    it("should handle programmatic navigate to same URL with replaceState", async () => {
      const mocks = setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/dashboard" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      // Navigate to /dashboard first
      await navigation.navigate({ id: "/dashboard", params: {} });

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Navigate to /dashboard again
      await navigation.navigate({ id: "/dashboard", params: {} });

      // Should use replaceState since we're already at /dashboard
      expect(mocks.history.replaceState).toHaveBeenCalled();
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });

    it("should handle query parameters in URL comparison", async () => {
      const mocks = setupBrowserMocks("/search?q=test");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/search" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Simulate popstate — URL already has /search?q=test
      mocks.firePopState();
      await new Promise((r) => setTimeout(r, 0));

      // Should use replaceState since URL matches
      expect(mocks.history.replaceState).toHaveBeenCalled();
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });
  });

  describe("restoreNavigation on init", () => {
    it("should use replaceState during initial route restore", async () => {
      const mocks = setupBrowserMocks("/dashboard");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/dashboard" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      // During registerRoutes, restoreNavigation calls popStateHandler
      // which should use replaceState (URL is already /dashboard)
      expect(mocks.history.replaceState).toHaveBeenCalled();
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should remove event listeners and navigation listener", async () => {
      setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      browser.dispose();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "hashchange",
        expect.any(Function),
      );
    });
  });
});
