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

function parseUrl(url: string) {
  let path = url;
  let hash = "";
  let search = "";
  const h = path.indexOf("#");
  if (h >= 0) {
    hash = path.slice(h);
    path = path.slice(0, h);
  }
  const q = path.indexOf("?");
  if (q >= 0) {
    search = path.slice(q);
    path = path.slice(0, q);
  }
  return { path, search, hash };
}

function setupBrowserMocks(initialPath = "/") {
  const listeners: Record<string, Function[]> = {};

  const historyStack: Array<{ state: unknown; url: string }> = [
    { state: null, url: initialPath },
  ];
  let historyIndex = 0;

  const fire = (event: string) => {
    for (const handler of listeners[event] || []) {
      handler();
    }
  };

  const mockLocation = {
    get pathname() {
      return parseUrl(historyStack[historyIndex]!.url).path;
    },
    get search() {
      return parseUrl(historyStack[historyIndex]!.url).search;
    },
    get hash() {
      return parseUrl(historyStack[historyIndex]!.url).hash;
    },
    set hash(value: string) {
      const { path, search } = parseUrl(historyStack[historyIndex]!.url);
      const normalized = value.startsWith("#") ? value : "#" + value;
      const newUrl = path + search + normalized;
      if (newUrl === historyStack[historyIndex]!.url) {
        return;
      }
      historyStack.splice(historyIndex + 1);
      historyStack.push({ state: null, url: newUrl });
      historyIndex++;
      fire("hashchange");
    },
  };

  const traverse = (from: number, to: number) => {
    const prev = parseUrl(historyStack[from]!.url);
    historyIndex = to;
    const next = parseUrl(historyStack[to]!.url);
    fire("popstate");
    if (prev.hash !== next.hash) {
      fire("hashchange");
    }
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
        traverse(historyIndex, historyIndex - 1);
      }
    }),
    forward: vi.fn(() => {
      if (historyIndex < historyStack.length - 1) {
        traverse(historyIndex, historyIndex + 1);
      }
    }),
  };

  const elementsById: Record<string, FakeElement> = {};
  const elementsByName: Record<string, FakeElement[]> = {};
  let activeElement: FakeElement | null = null;

  interface FakeElement {
    scrollIntoView: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn>;
    setAttribute: ReturnType<typeof vi.fn>;
    attrs: Record<string, string>;
  }

  const makeElement = (): FakeElement => {
    const el: FakeElement = {
      scrollIntoView: vi.fn(),
      focus: vi.fn(() => {
        activeElement = el;
      }),
      setAttribute: vi.fn((k: string, v: string) => {
        el.attrs[k] = v;
      }),
      attrs: {},
    };
    return el;
  };

  const mockDocument = {
    getElementById: vi.fn((id: string) => elementsById[id] ?? null),
    getElementsByName: vi.fn((name: string) => elementsByName[name] ?? []),
    get activeElement() {
      return activeElement;
    },
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
    scrollTo: vi.fn(),
    location: mockLocation,
    history: mockHistory,
    document: mockDocument,
  };

  vi.stubGlobal("window", mockWindow);

  return {
    history: mockHistory,
    location: mockLocation,
    scrollTo: mockWindow.scrollTo,
    installNavigationApi: () => {
      const navigate = vi.fn(() => ({
        committed: Promise.resolve(),
        finished: Promise.resolve(),
      }));
      (mockWindow as { navigation?: unknown }).navigation = { navigate };
      return navigate;
    },
    firePopState: () => fire("popstate"),
    fireHashChange: () => fire("hashchange"),
    addElement: (id: string) => {
      const el = makeElement();
      elementsById[id] = el;
      return el;
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

  describe("hash handling", () => {
    const tick = () => new Promise((r) => setTimeout(r, 0));

    it("preserves the hash on initial restore", async () => {
      const mocks = setupBrowserMocks("/docs#section");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
      expect(mocks.history.replaceState).toHaveBeenCalledWith(
        { id: "/docs", params: {}, hash: "#section" },
        "",
        "/docs#section",
      );
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });

    it("clears the hash and leaves scroll to the app on a hashless navigation", async () => {
      const mocks = setupBrowserMocks("/docs#section");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });
      navigation.router.addRoute({ id: "/about" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();
      mocks.scrollTo.mockClear();

      await navigation.navigate({ id: "/about", params: {} });

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { id: "/about", params: {} },
        "",
        "/about",
      );
      expect(mocks.scrollTo).not.toHaveBeenCalled();
      expect(navigation.state).toEqual({ id: "/about", params: {} });
      expect(mocks.location.hash).toBe("");
    });

    it("uses the Navigation API for a cross-route hash navigation when available", async () => {
      const mocks = setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const navigate = mocks.installNavigationApi();
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();

      await navigation.navigate({ id: "/docs", params: {}, hash: "#section" });

      expect(navigate).toHaveBeenCalledWith("/docs#section", {
        history: "push",
        state: { id: "/docs", params: {}, hash: "#section" },
      });
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });

    it("uses location.hash (not pushState) for a hash-only forward change", async () => {
      const mocks = setupBrowserMocks("/docs");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      await navigation.navigate({ id: "/docs", params: {}, hash: "#section" });

      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.location.hash).toBe("#section");
      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
      expect(mocks.getHistoryStack().at(-1)?.url).toBe("/docs#section");
    });

    it("scrolls to and focuses the target element on a cross-route hash navigation", async () => {
      const mocks = setupBrowserMocks("/");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      const target = mocks.addElement("section");

      await navigation.navigate({ id: "/docs", params: {}, hash: "#section" });

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { id: "/docs", params: {}, hash: "#section" },
        "",
        "/docs#section",
      );
      expect(target.scrollIntoView).toHaveBeenCalled();
      expect(target.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it("syncs navigation state when the user changes the hash (anchor click)", async () => {
      const mocks = setupBrowserMocks("/docs");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Simulate a native in-page anchor click
      window.location.hash = "#section";
      await tick();

      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.history.replaceState).toHaveBeenCalled();
    });

    it("handles a hash-only back/forward without double navigation", async () => {
      const mocks = setupBrowserMocks("/docs");
      const navigation = createNavigation();
      navigation.router.addRoute({ id: "/" });
      navigation.router.addRoute({ id: "/docs" });

      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      window.location.hash = "#section";
      await tick();

      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      // Back to /docs fires both popstate and hashchange
      window.history.back();
      await tick();

      expect(navigation.state).toEqual({ id: "/docs", params: {} });
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.history.replaceState).toHaveBeenCalledTimes(1);
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
