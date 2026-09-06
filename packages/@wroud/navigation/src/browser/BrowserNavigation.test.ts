import { describe, it, expect, afterEach, vi } from "vitest";
import { Navigation } from "../Navigation.js";
import { NavigationType } from "../NavigationListener.js";
import { Router } from "../Router.js";
import { TriePatternMatching } from "../pattern-matching/TriePatternMatching.js";
import type { IRouteState } from "../IRouteState.js";
import { BrowserNavigation } from "./BrowserNavigation.js";

const ORIGIN = "https://example.test";
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await tick();
  }
};

const ROUTES = [
  "/",
  "/a",
  "/b",
  "/c",
  "/docs",
  "/dashboard",
  "/about",
  "/login",
];

function createNavigation(
  options: { trailingSlash?: boolean; base?: string } = {},
  routes: string[] = ROUTES,
) {
  const router = new Router({
    matcher: new TriePatternMatching({ trailingSlash: false, ...options }),
  });
  const navigation = new Navigation(router);
  for (const id of routes) {
    router.addRoute({ id });
  }
  return navigation;
}

const route = (id: string, extra: Partial<IRouteState> = {}): IRouteState => ({
  id,
  params: {},
  ...extra,
});

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

interface StackEntry {
  key: string;
  state: unknown;
  url: string;
}

interface NavigateInit {
  navigationType: "push" | "replace" | "traverse" | "reload";
  url: string;
  key?: string;
  info?: unknown;
  state?: unknown;
  hashChange?: boolean;
  canIntercept?: boolean;
  downloadRequest?: string | null;
  formData?: FormData | null;
  userInitiated?: boolean;
  sourceElement?: object | null;
  sameDocument?: boolean;
}

interface NavigateRecord {
  navigationType: string;
  url: string;
  intercepted: boolean;
  prevented: boolean;
  manualScroll: boolean;
  manualFocus: boolean;
  info: unknown;
}

interface FakeElement {
  scrollIntoView: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  attrs: Record<string, string>;
  localName: string;
  blur: () => void;
}

function isHashChange(from: string, to: string) {
  const prev = parseUrl(from);
  const next = parseUrl(to);
  return (
    prev.path === next.path &&
    prev.search === next.search &&
    prev.hash !== next.hash
  );
}

function setupBrowser(
  initialPath = "/",
  options: { navigationApi?: boolean } = {},
) {
  const listeners: Record<string, Function[]> = {};
  let keyCounter = 0;
  const nextKey = () => `k${++keyCounter}`;
  const stack: StackEntry[] = [
    { key: nextKey(), state: null, url: initialPath },
  ];
  let index = 0;
  let extraLength = 0;
  const scroll = { x: 0, y: 0 };
  const log: string[] = [];
  const errors: unknown[] = [];
  const navigateEvents: NavigateRecord[] = [];
  const navApi = options.navigationApi ?? false;
  let ongoing: (() => void) | null = null;

  const fire = (type: string, event?: unknown) => {
    for (const handler of [...(listeners[type] ?? [])]) {
      try {
        handler(event);
      } catch (error) {
        errors.push(error);
      }
    }
  };

  const traverseTo = (to: number) => {
    const prev = parseUrl(stack[index]!.url);
    index = to;
    const next = parseUrl(stack[to]!.url);
    fire("popstate", { state: stack[to]!.state });
    if (prev.hash !== next.hash) {
      setTimeout(() => fire("hashchange"), 0);
    }
  };

  const browserUrl = (url: string) => {
    const parsed = new URL(url, ORIGIN);
    return parsed.pathname + parsed.search + parsed.hash;
  };

  const mockLocation = {
    get href() {
      return ORIGIN + stack[index]!.url;
    },
    get pathname() {
      return parseUrl(stack[index]!.url).path;
    },
    get search() {
      return parseUrl(stack[index]!.url).search;
    },
    get hash() {
      return parseUrl(stack[index]!.url).hash;
    },
    set hash(value: string) {
      const { path, search } = parseUrl(stack[index]!.url);
      const normalized = value.startsWith("#") ? value : "#" + value;
      const url = browserUrl(path + search + normalized);
      if (url === stack[index]!.url) {
        return;
      }
      if (navApi) {
        dispatchNavigate({
          navigationType: "push",
          url,
          hashChange: true,
          userInitiated: true,
          state: stack[index]!.state,
        });
        return;
      }
      stack.splice(index + 1);
      stack.push({ key: nextKey(), state: null, url });
      index++;
      fire("popstate", { state: null });
      setTimeout(() => fire("hashchange"), 0);
    },
  };

  const classic = (
    navigationType: "push" | "replace",
    state: unknown,
    url?: string | null,
  ) => {
    const target = url == null ? stack[index]!.url : browserUrl(url);
    if (navApi) {
      dispatchNavigate({
        navigationType,
        url: target,
        hashChange: isHashChange(stack[index]!.url, target),
        state: stack[index]!.state,
      });
      return;
    }
    if (navigationType === "push") {
      stack.splice(index + 1);
      stack.push({ key: nextKey(), state, url: target });
      index++;
    } else {
      stack[index] = { key: stack[index]!.key, state, url: target };
    }
  };

  const mockHistory = {
    scrollRestoration: "auto" as ScrollRestoration,
    get state() {
      return stack[index]!.state;
    },
    get length() {
      return stack.length + extraLength;
    },
    pushState: vi.fn((state: unknown, _t: string, url?: string | null) => {
      classic("push", state, url);
    }),
    replaceState: vi.fn((state: unknown, _t: string, url?: string | null) => {
      classic("replace", state, url);
    }),
    back: vi.fn(() => mockHistory.go(-1)),
    forward: vi.fn(() => mockHistory.go(1)),
    go: vi.fn((delta: number) => {
      const to = index + delta;
      if (delta === 0 || to < 0 || to >= stack.length) {
        return;
      }
      setTimeout(() => {
        if (navApi) {
          dispatchNavigate({
            navigationType: "traverse",
            url: stack[to]!.url,
            key: stack[to]!.key,
          });
        } else {
          traverseTo(to);
        }
      }, 0);
    }),
  };

  const elementsById: Record<string, FakeElement> = {};
  const elementsByName: Record<string, FakeElement[]> = {};
  let activeElement: FakeElement | null = null;

  const makeElement = (localName: string): FakeElement => {
    const blurHandlers: Function[] = [];
    const el: FakeElement = {
      scrollIntoView: vi.fn(),
      focus: vi.fn(() => {
        activeElement = el;
      }),
      setAttribute: vi.fn((k: string, v: string) => {
        el.attrs[k] = v;
      }),
      removeAttribute: vi.fn((k: string) => {
        delete el.attrs[k];
      }),
      addEventListener: vi.fn((type: string, handler: Function) => {
        if (type === "blur") blurHandlers.push(handler);
      }),
      attrs: {},
      localName,
      blur: () => {
        activeElement = null;
        for (const handler of blurHandlers.splice(0)) handler();
      },
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

  const entriesOf = () =>
    stack.map((entry, i) => ({
      key: entry.key,
      id: entry.key,
      index: i,
      url: ORIGIN + entry.url,
      sameDocument: true,
      getState: () => entry.state,
    }));

  function commitEntry(init: NavigateInit) {
    const url = browserUrl(init.url);
    if (init.navigationType === "push") {
      stack.splice(index + 1);
      stack.push({ key: nextKey(), state: init.state ?? null, url });
      index++;
    } else if (init.navigationType === "replace") {
      stack[index] = {
        key: stack[index]!.key,
        state: init.state ?? null,
        url,
      };
    } else if (init.navigationType === "traverse") {
      index = stack.findIndex((entry) => entry.key === init.key);
    }
  }

  function dispatchNavigate(init: NavigateInit) {
    let intercepted = false;
    let handler: (() => Promise<void> | void) | null = null;
    let prevented = false;
    let manualScroll = false;
    let manualFocus = false;
    const cancelable =
      init.navigationType !== "traverse" || !init.userInitiated;
    const event = {
      navigationType: init.navigationType,
      hashChange: init.hashChange ?? false,
      canIntercept: init.canIntercept ?? true,
      downloadRequest: init.downloadRequest ?? null,
      formData: init.formData ?? null,
      info: init.info,
      cancelable,
      userInitiated: init.userInitiated ?? false,
      sourceElement: init.sourceElement ?? null,
      get defaultPrevented() {
        return prevented;
      },
      destination: {
        url: new URL(init.url, ORIGIN).href,
        key: init.navigationType === "traverse" ? init.key! : "",
        sameDocument: init.sameDocument ?? true,
        getState: () => null,
      },
      signal: new AbortController().signal,
      preventDefault() {
        if (cancelable) prevented = true;
      },
      intercept(opts?: {
        handler?: () => Promise<void> | void;
        scroll?: string;
        focusReset?: string;
      }) {
        if (!event.canIntercept) {
          throw new DOMException("cannot intercept", "SecurityError");
        }
        if (prevented) {
          throw new DOMException("canceled", "InvalidStateError");
        }
        intercepted = true;
        handler = opts?.handler ?? null;
        manualScroll = opts?.scroll === "manual";
        manualFocus = opts?.focusReset === "manual";
      },
      scroll: vi.fn(() => {
        if (!manualScroll) {
          throw new DOMException("scroll is not manual", "InvalidStateError");
        }
        log.push("scroll-fragment");
      }),
    };
    ongoing?.();
    fire("navigate", event);
    navigateEvents.push({
      navigationType: init.navigationType,
      url: init.url,
      intercepted,
      prevented,
      manualScroll,
      manualFocus,
      info: init.info,
    });

    if (prevented) {
      const error = Object.assign(new Error("aborted"), { name: "AbortError" });
      const rejected = Promise.reject(error);
      rejected.catch(() => {});
      return { committed: rejected, finished: rejected };
    }

    commitEntry(init);
    let live = true;
    let abort!: () => void;
    const aborted = new Promise<never>((_, reject) => {
      abort = () => {
        live = false;
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      };
    });
    aborted.catch(() => {});
    ongoing = abort;
    const done = (async () => {
      if (intercepted) {
        if (handler) {
          await (handler as () => Promise<void> | void)();
        }
        if (live && !manualScroll) log.push("scroll-restore");
      }
      if (live) ongoing = null;
    })();
    const finished = Promise.race([done, aborted]);
    finished.catch(() => {});
    return { committed: Promise.resolve(), finished };
  }

  function deferredDispatch(init: NavigateInit) {
    const result = new Promise<{
      committed: Promise<void>;
      finished: Promise<void>;
    }>((resolve) => {
      setTimeout(() => resolve(dispatchNavigate(init)), 0);
    });
    return {
      committed: result.then((r) => r.committed),
      finished: result.then((r) => r.finished),
    };
  }

  const navigationMock = {
    addEventListener: vi.fn((type: string, handler: Function) => {
      (listeners[type] = listeners[type] || []).push(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: Function) => {
      const arr = listeners[type];
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }),
    get currentEntry() {
      return entriesOf()[index] ?? null;
    },
    entries: () => entriesOf(),
    get canGoBack() {
      return index > 0;
    },
    get canGoForward() {
      return index < stack.length - 1;
    },
    navigate: vi.fn(
      (
        url: string,
        opts: { history?: string; state?: unknown; info?: unknown } = {},
      ) => {
        return dispatchNavigate({
          navigationType: opts.history === "replace" ? "replace" : "push",
          url,
          hashChange: isHashChange(stack[index]!.url, url),
          info: opts.info,
          state: opts.state,
        });
      },
    ),
    traverseTo: vi.fn((key: string, opts: { info?: unknown } = {}) => {
      const to = stack.findIndex((entry) => entry.key === key);
      if (to === -1) {
        throw new DOMException("no such entry", "InvalidStateError");
      }
      if (to === index) {
        return { committed: Promise.resolve(), finished: Promise.resolve() };
      }
      return deferredDispatch({
        navigationType: "traverse",
        url: stack[to]!.url,
        key,
        info: opts.info,
      });
    }),
    back: vi.fn((opts: { info?: unknown } = {}) =>
      navigationMock.traverseTo(stack[index - 1]!.key, opts),
    ),
    forward: vi.fn((opts: { info?: unknown } = {}) =>
      navigationMock.traverseTo(stack[index + 1]!.key, opts),
    ),
    updateCurrentEntry: vi.fn((opts?: { state?: unknown }) => {
      stack[index]!.state = opts?.state ?? null;
    }),
  };

  const mockWindow = {
    addEventListener: vi.fn((type: string, handler: Function) => {
      (listeners[type] = listeners[type] || []).push(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: Function) => {
      const arr = listeners[type];
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }),
    scrollTo: vi.fn((x: number, y: number) => {
      scroll.x = x;
      scroll.y = y;
    }),
    setTimeout: (handler: () => void, ms?: number) =>
      setTimeout(handler, ms) as unknown as number,
    clearTimeout: (id: number) =>
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>),
    get scrollX() {
      return scroll.x;
    },
    get scrollY() {
      return scroll.y;
    },
    location: mockLocation,
    history: mockHistory,
    document: mockDocument,
    navigation: navApi ? navigationMock : undefined,
  };

  vi.stubGlobal("window", mockWindow);

  const userTraverse = async (to: number, userInitiated = true) => {
    if (to < 0 || to >= stack.length) {
      return;
    }
    if (navApi) {
      await deferredDispatch({
        navigationType: "traverse",
        url: stack[to]!.url,
        key: stack[to]!.key,
        userInitiated,
      }).finished.catch(() => {});
    } else {
      traverseTo(to);
    }
    await settle();
  };

  return {
    window: mockWindow,
    history: mockHistory,
    location: mockLocation,
    navigation: navigationMock,
    scrollTo: mockWindow.scrollTo,
    setScroll: (y: number) => {
      scroll.y = y;
    },
    getScroll: () => ({ ...scroll }),
    log,
    errors,
    navigateEvents,
    dispatchNavigate,
    fire,
    bumpLength: () => {
      extraLength++;
    },
    userBack: () => userTraverse(index - 1),
    userForward: () => userTraverse(index + 1),
    userTraverseTo: (key: string) =>
      userTraverse(stack.findIndex((entry) => entry.key === key)),
    clickLink: (url: string) =>
      dispatchNavigate({ navigationType: "push", url, userInitiated: true }),
    pushForeignEntry: (url: string) => {
      stack.splice(index + 1);
      stack.push({ key: nextKey(), state: null, url });
      index++;
      return stack[index]!.key;
    },
    getStack: () => stack.map((entry) => entry.url),
    getKeys: () => stack.map((entry) => entry.key),
    getStates: () => stack.map((entry) => entry.state),
    getIndex: () => index,
    getUrl: () => stack[index]!.url,
    getCurrentKey: () => stack[index]!.key,
    getHistoryState: () => stack[index]!.state,
    addElement: (id: string, localName = "div") => {
      const el = makeElement(localName);
      elementsById[id] = el;
      return el;
    },
    addNamedElement: (name: string, localName: string) => {
      const el = makeElement(localName);
      (elementsByName[name] ??= []).push(el);
      return el;
    },
  };
}

async function setup(
  initialPath: string,
  options: {
    navigationApi?: boolean;
    interceptLinks?: boolean;
    matcher?: { trailingSlash?: boolean; base?: string };
    routes?: string[];
  } = {},
) {
  const mocks = setupBrowser(initialPath, {
    navigationApi: options.navigationApi ?? false,
  });
  const navigation = createNavigation(options.matcher ?? {}, options.routes);
  const events: Array<{
    type: NavigationType;
    from: string | null;
    to: string | null;
  }> = [];
  navigation.addListener((type, from, to) => {
    events.push({ type, from: from?.id ?? null, to: to?.id ?? null });
  });
  const browser = new BrowserNavigation(navigation, {
    interceptLinks: options.interceptLinks ?? true,
  });
  await browser.registerRoutes();
  await settle();
  mocks.history.pushState.mockClear();
  mocks.history.replaceState.mockClear();
  mocks.scrollTo.mockClear();
  return { mocks, navigation, browser, events };
}

describe("BrowserNavigation", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("History API mode — initial restore", () => {
    it("notifies the initial navigation with from === null and keys the entry", async () => {
      const mocks = setupBrowser("/docs");
      const navigation = createNavigation();
      const events: Array<[NavigationType, string | null, string | null]> = [];
      navigation.addListener((type, from, to) => {
        events.push([type, from?.id ?? null, to?.id ?? null]);
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      expect(events).toEqual([[NavigationType.Navigate, null, "/docs"]]);
      expect(navigation.position).toBe(0);
      expect(mocks.history.replaceState).toHaveBeenCalledWith(
        { key: expect.any(String) },
        "",
        undefined,
      );
      expect(navigation.currentEntry?.key).toBe(
        (mocks.getHistoryState() as { key: string }).key,
      );
      expect(mocks.history.scrollRestoration).toBe("auto");
      expect(mocks.history.pushState).not.toHaveBeenCalled();
    });

    it.each([
      [
        "/docs?gclid=abc&utm_source=x",
        {},
        { id: "/docs", params: {}, unknownQuery: "gclid=abc&utm_source=x" },
      ],
      ["/docs#section", {}, { id: "/docs", params: {}, hash: "#section" }],
      ["/docs", { trailingSlash: true }, { id: "/docs", params: {} }],
      ["/app", { base: "/app" }, { id: "/", params: {} }],
    ])(
      "keeps the address bar byte-identical on restore of %s",
      async (url, matcher, expected) => {
        const { mocks, navigation } = await setup(url, { matcher });
        expect(mocks.getUrl()).toBe(url);
        expect(navigation.state).toEqual(expected);
      },
    );

    it("stamps history.state with the current entry's key", async () => {
      const mocks = setupBrowser("/docs");
      mocks.history.replaceState({ key: "persisted" }, "");
      const navigation = createNavigation();
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
    });

    it("creates a null entry for a URL that matches no route", async () => {
      const { navigation, events } = await setup("/nowhere");
      expect(navigation.state).toBeNull();
      expect(navigation.position).toBe(0);
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: null, to: null },
      ]);
    });
  });

  describe("History API mode — programmatic navigation", () => {
    it("pushes a keyed entry, commits the URL before listeners, and scrolls to top", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(400);
      const seenUrl: string[] = [];
      navigation.addListener(() => {
        seenUrl.push(mocks.getUrl());
      });

      expect(await navigation.navigate(route("/dashboard"))).toBe(true);
      await settle();

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        "/dashboard",
      );
      expect(seenUrl).toEqual(["/dashboard"]);
      expect(mocks.scrollTo).toHaveBeenCalledWith(0, 0);
      expect(mocks.getStack()).toEqual(["/", "/dashboard"]);
    });

    it("commits the URL before a listener registered ahead of the bridge", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      const seen: string[] = [];
      navigation.addListener(async () => {
        await tick();
        seen.push(mocks.getUrl());
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await settle();

      await navigation.navigate(route("/a"));
      await settle();
      expect(seen).toEqual(["/", "/a"]);
    });

    it("pushes a duplicate entry without changing the address bar when already at the URL", async () => {
      const { mocks, navigation } = await setup("/dashboard?gclid=x");
      mocks.setScroll(400);
      await navigation.navigate(route("/dashboard"));
      await settle();

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        undefined,
      );
      expect(mocks.getUrl()).toBe("/dashboard?gclid=x");
      expect(mocks.getStack()).toEqual([
        "/dashboard?gclid=x",
        "/dashboard?gclid=x",
      ]);
      expect(navigation.position).toBe(1);
      expect(mocks.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it("scrolls to the fragment on a push to the URL it is already at", async () => {
      const { mocks, navigation } = await setup("/docs#section");
      const el = mocks.addElement("section");
      mocks.setScroll(400);
      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        undefined,
      );
      expect(mocks.getStack()).toEqual(["/docs#section", "/docs#section"]);
      expect(navigation.position).toBe(1);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("keeps the address bar on a same-route replace from a tracking URL", async () => {
      const { mocks, navigation } = await setup("/dashboard?gclid=x");
      const key = navigation.currentEntry!.key;
      await navigation.replace(route("/dashboard"));

      expect(mocks.history.replaceState).toHaveBeenCalledWith(
        { key },
        "",
        undefined,
      );
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/dashboard?gclid=x");
      expect(navigation.currentEntry!.key).toBe(key);
      expect(mocks.getStack()).toHaveLength(1);
    });

    it("replaces the URL on a cross-route replace and keeps the scroll position", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(240);
      await navigation.replace(route("/about"));
      await settle();
      expect(mocks.getStack()).toEqual(["/about"]);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/about"]);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
      expect(mocks.getScroll().y).toBe(240);
    });

    it("applies the fragment on a replace whose target has a hash", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(240);
      const el = mocks.addElement("section");
      await navigation.replace(route("/about", { hash: "#section" }));
      await settle();
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("applies the fragment on a replace to the URL it is already at", async () => {
      const { mocks, navigation } = await setup("/docs#section");
      const key = navigation.currentEntry!.key;
      const el = mocks.addElement("section");
      mocks.setScroll(400);
      await navigation.replace(route("/docs", { hash: "#section" }));
      await settle();

      expect(mocks.history.replaceState).toHaveBeenCalledWith(
        { key },
        "",
        undefined,
      );
      expect(mocks.getStack()).toEqual(["/docs#section"]);
      expect(navigation.currentEntry!.key).toBe(key);
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("keeps tracking the current entry when the browser percent-encodes the fragment", async () => {
      const { mocks, navigation } = await setup("/docs");
      await navigation.navigate(route("/docs", { hash: "#a b" }));
      await settle();
      expect(mocks.getUrl()).toBe("/docs#a%20b");
      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#a b",
      });
      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      expect(await navigation.navigate(route("/docs", { hash: "#a b" }))).toBe(
        true,
      );
      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        undefined,
      );
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
      expect(navigation.position).toBe(2);
      expect(mocks.getStack()).toEqual(["/docs", "/docs#a%20b", "/docs#a%20b"]);
    });

    it("uses pushState (not location.hash) for a hash-only change and keeps undeclared params", async () => {
      const { mocks, navigation } = await setup("/docs?gclid=x");
      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();

      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        "/docs#section",
      );
      expect(mocks.location.hash).toBe("#section");
      expect(navigation.position).toBe(1);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("scrolls to and focuses the fragment target after asynchronous rendering (H)", async () => {
      const { mocks, navigation } = await setup("/");
      let rendered = false;
      navigation.addListener(async () => {
        await tick();
        rendered = true;
      });
      const el = mocks.addElement("section");
      const lookup = mocks.window.document.getElementById;
      lookup.mockImplementation((id: string) =>
        rendered && id === "section" ? el : null,
      );

      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();

      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(el.focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("adds a temporary tabindex to a non-focusable fragment target and removes it on blur", async () => {
      const { mocks, navigation } = await setup("/");
      const el = mocks.addElement("section");
      el.focus.mockImplementationOnce(() => {});

      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();

      expect(el.attrs["tabindex"]).toBe("-1");
      expect(el.focus).toHaveBeenCalledTimes(2);
      el.blur();
      expect(el.attrs["tabindex"]).toBeUndefined();
    });

    it("scrolls to top for #top", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/docs", { hash: "#top" }));
      await settle();
      expect(mocks.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it("scrolls to an element named top instead of the document top", async () => {
      const { mocks, navigation } = await setup("/");
      const el = mocks.addElement("top");
      await navigation.navigate(route("/docs", { hash: "#top" }));
      await settle();
      expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("matches fragment names only on anchors", async () => {
      const { mocks, navigation } = await setup("/");
      const input = mocks.addNamedElement("section", "input");
      const anchor = mocks.addNamedElement("section", "a");
      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();
      expect(input.scrollIntoView).not.toHaveBeenCalled();
      expect(anchor.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("looks the fragment up raw before percent-decoding it", async () => {
      const { mocks, navigation } = await setup("/");
      const raw = mocks.addElement("a%20b");
      const decoded = mocks.addElement("a b");
      await navigation.navigate(route("/docs", { hash: "#a%20b" }));
      await settle();
      expect(raw.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(decoded.scrollIntoView).not.toHaveBeenCalled();
    });

    it("removes the temporary tabindex when the fragment target cannot be focused", async () => {
      const { mocks, navigation } = await setup("/");
      const el = mocks.addElement("section");
      el.focus.mockImplementation(() => {});
      await navigation.navigate(route("/docs", { hash: "#section" }));
      await settle();
      expect(el.focus).toHaveBeenCalledTimes(2);
      expect(el.attrs["tabindex"]).toBeUndefined();
      expect(el.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe("History API mode — browser-initiated traversal", () => {
    it("moves the cursor on a user Back instead of pushing (A)", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      events.length = 0;
      mocks.history.pushState.mockClear();

      await mocks.userBack();

      expect(navigation.position).toBe(1);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);
      expect(navigation.state?.id).toBe("/a");
      expect(mocks.getUrl()).toBe("/a");
      expect(events).toEqual([
        { type: NavigationType.Back, from: "/b", to: "/a" },
      ]);
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
    });

    it("keeps state and URL aligned through goBack after user Backs (B)", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));

      await mocks.userBack();
      await mocks.userBack();
      expect(navigation.state?.id).toBe("/");
      expect(navigation.canGoBack).toBe(false);
      events.length = 0;

      expect(await navigation.goBack()).toBe(false);
      expect(mocks.history.go).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/");
      expect(navigation.state?.id).toBe("/");

      expect(await navigation.goForward()).toBe(true);
      await settle();
      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.state?.id).toBe("/a");
      expect(events).toEqual([
        { type: NavigationType.Forward, from: "/", to: "/a" },
      ]);
    });

    it("notifies exactly once for a hash-only Back with popstate and hashchange in separate tasks (C)", async () => {
      const { mocks, navigation, events } = await setup("/docs");
      await navigation.navigate(route("/docs", { hash: "#section" }));
      events.length = 0;

      await mocks.userBack();

      expect(events).toEqual([
        { type: NavigationType.Back, from: "/docs", to: "/docs" },
      ]);
      expect(navigation.state).toEqual({ id: "/docs", params: {} });
      expect(navigation.position).toBe(0);
      expect(navigation.history).toHaveLength(2);
    });

    it("observes a user Forward after an app goBack that could not move the browser (F)", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await mocks.userBack();
      events.length = 0;

      expect(await navigation.goBack()).toBe(false);
      await mocks.userForward();

      expect(events).toEqual([
        { type: NavigationType.Forward, from: "/", to: "/a" },
      ]);
      expect(navigation.state?.id).toBe("/a");
      expect(mocks.getUrl()).toBe("/a");
    });

    it("reverts the browser when a guard refuses a user traversal (G)", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      let allow = true;
      navigation.router.addRoute({ id: "/private", canActivate: () => allow });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/private"));
      await mocks.userBack();
      expect(mocks.getUrl()).toBe("/a");

      allow = false;
      const events: string[] = [];
      navigation.addListener((type) => {
        events.push(type);
      });
      await mocks.userForward();

      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.state?.id).toBe("/a");
      expect(navigation.position).toBe(1);
      expect(events).toEqual([]);
    });

    it("reverts across multiple entries when a guard refuses", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      navigation.router.addRoute({
        id: "/editor",
        canDeactivate: (to) => to?.id !== "/",
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/editor"));

      await mocks.userTraverseTo(mocks.getKeys()[0]!);

      expect(mocks.getUrl()).toBe("/editor");
      expect(navigation.state?.id).toBe("/editor");
      expect(navigation.position).toBe(2);
    });

    it("syncs a user fragment click as a keyed push", async () => {
      const { mocks, navigation, events } = await setup("/docs");
      events.length = 0;
      mocks.location.hash = "#section";
      await settle();

      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
      expect(navigation.position).toBe(1);
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: "/docs", to: "/docs" },
      ]);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(mocks.history.pushState).not.toHaveBeenCalled();

      await mocks.userBack();
      expect(navigation.position).toBe(0);
      await mocks.userForward();
      expect(navigation.position).toBe(1);
      expect(events).toHaveLength(3);
    });

    it("lets a guard redirect from a traversal to a foreign entry", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      navigation.router.addRoute({
        id: "/private",
        canActivate: async () => {
          await navigation.replace(route("/login"));
          return false;
        },
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.pushForeignEntry("/private");
      await mocks.userBack();
      await mocks.userForward();

      expect(mocks.getUrl()).toBe("/login");
      expect(navigation.state?.id).toBe("/login");
      expect(mocks.getStack()).toEqual(["/", "/login"]);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
      expect(navigation.position).toBe(1);
    });

    it("restores the saved scroll position on a keyed traversal", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(300);
      await navigation.navigate(route("/a"));
      await settle();
      expect(mocks.getScroll().y).toBe(0);
      mocks.setScroll(120);

      await mocks.userBack();
      expect(mocks.getScroll().y).toBe(300);

      await mocks.userForward();
      expect(mocks.getScroll().y).toBe(120);
    });

    it("restores scroll only after listeners finished rendering", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(300);
      await navigation.navigate(route("/a"));
      await settle();
      const order: string[] = [];
      navigation.addListener(async () => {
        await tick();
        order.push(`render:${mocks.getScroll().y}`);
      });

      await mocks.userBack();
      order.push(`after:${mocks.getScroll().y}`);
      expect(order).toEqual(["render:0", "after:300"]);
    });

    it("does not scroll for a navigation the user left before it finished", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(300);
      const el = mocks.addElement("section");
      let release!: () => void;
      navigation.addListener((_type, _from, to) =>
        to?.hash
          ? new Promise<void>((resolve) => (release = resolve))
          : undefined,
      );

      await navigation.navigate(route("/docs", { hash: "#section" }));
      await mocks.userBack();
      expect(navigation.state?.id).toBe("/");
      expect(mocks.getScroll().y).toBe(300);

      release();
      await settle();
      expect(el.scrollIntoView).not.toHaveBeenCalled();
      expect(mocks.getScroll().y).toBe(300);
    });

    it("keeps a back-traversal's restored position when the left entry finishes late", async () => {
      const { mocks, navigation } = await setup("/");
      mocks.setScroll(300);
      let release!: () => void;
      navigation.addListener((_type, _from, to) =>
        to?.id === "/a"
          ? new Promise<void>((resolve) => (release = resolve))
          : undefined,
      );

      await navigation.navigate(route("/a"));
      expect(mocks.getScroll().y).toBe(300);
      await mocks.userBack();
      expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
      expect(mocks.getScroll().y).toBe(300);

      release();
      await settle();
      expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
      expect(mocks.getScroll().y).toBe(300);

      await mocks.userForward();
      release();
      await settle();
      expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
    });

    it("keeps the displayed transition latest when an app traversal does not arrive", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      await settle();
      let release!: () => void;
      navigation.addListener((_type, _from, to) =>
        to?.id === "/b"
          ? new Promise<void>((resolve) => (release = resolve))
          : undefined,
      );
      await navigation.navigate(route("/b"));
      mocks.history.pushState(mocks.getHistoryState(), "", mocks.getUrl());
      mocks.scrollTo.mockClear();

      expect(await navigation.goBack()).toBe(false);
      await settle();
      expect(navigation.state?.id).toBe("/b");
      expect(mocks.scrollTo).not.toHaveBeenCalled();

      release();
      await settle();
      expect(mocks.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it("takes over scroll restoration on a user Back between user-created entries", async () => {
      const { mocks, navigation } = await setup("/docs");
      mocks.location.hash = "#section";
      await settle();
      expect(navigation.position).toBe(1);
      expect(mocks.history.scrollRestoration).toBe("auto");

      await mocks.userBack();
      expect(navigation.position).toBe(0);
      expect(mocks.history.scrollRestoration).toBe("manual");
    });

    it("resolves goBack as not applied for an entry created before registerRoutes", async () => {
      setupBrowser("/b");
      const navigation = createNavigation();
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      expect(navigation.position).toBe(1);
      expect(navigation.history).toHaveLength(2);

      const result = await Promise.race([
        navigation.goBack(),
        settle().then(() => "hung" as const),
      ]);

      expect(result).toBe(false);
      expect(navigation.position).toBe(1);
      expect(window.history.go).not.toHaveBeenCalled();
      browser.dispose();
    });

    it("forgets scroll positions of entries dropped by a push", async () => {
      const { mocks, navigation, browser } = await setup("/");
      const positions = (
        browser as unknown as {
          platform: { scrollPositions: Map<string, unknown> };
        }
      ).platform.scrollPositions;
      for (let i = 0; i < 20; i++) {
        mocks.setScroll(100 + i);
        await navigation.navigate(route("/a"));
        await mocks.userBack();
      }
      expect(navigation.entries.length).toBe(2);
      expect(positions.size).toBeLessThanOrEqual(2);
      for (const key of positions.keys()) {
        expect(navigation.entries.some((entry) => entry.key === key)).toBe(
          true,
        );
      }
    });

    it("resolves an app traversal as not applied when the user navigated elsewhere first", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));

      const pendingBack = navigation.goBack();
      mocks.history.pushState({ key: "foreign" }, "", "/c");
      await settle();

      expect(await pendingBack).toBe(false);
      expect(mocks.getUrl()).toBe("/c");
      expect(navigation.state?.id).toBe("/b");
      expect(mocks.getStack()).toEqual(["/", "/a", "/b", "/c"]);
    });

    it("resolves an app traversal as not applied when a user popstate lands before its own", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      events.length = 0;
      const goIssued = new Promise<void>((resolve) => {
        const go = mocks.history.go.getMockImplementation()!;
        mocks.history.go.mockImplementationOnce((delta: number) => {
          go(delta);
          resolve();
        });
      });

      const pendingBack = navigation.goBack();
      await goIssued;
      await mocks.userTraverseTo(mocks.getKeys()[0]!);

      expect(await pendingBack).toBe(false);
      expect(events).toEqual([
        { type: NavigationType.Back, from: "/b", to: "/" },
        { type: NavigationType.Forward, from: "/", to: "/a" },
      ]);
      expect(navigation.state?.id).toBe("/a");
      expect(mocks.getUrl()).toBe("/a");
    });

    it("survives a foreign replaceState that unstamps the current entry", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      mocks.history.replaceState({}, "");
      mocks.history.pushState.mockClear();

      expect(await navigation.navigate(route("/b"))).toBe(true);
      expect(mocks.history.pushState).toHaveBeenCalledTimes(1);
      expect(mocks.getStack()).toEqual(["/", "/a", "/b"]);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);

      mocks.history.replaceState({}, "");
      expect(await navigation.replace(route("/c"))).toBe(true);
      expect(mocks.getUrl()).toBe("/c");
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });

      mocks.history.replaceState({}, "");
      expect(await navigation.goBack()).toBe(true);
      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.state?.id).toBe("/a");
      expect(mocks.getStates()).toEqual(
        navigation.entries.map((entry) => ({ key: entry.key })),
      );
      expect(await navigation.goForward()).toBe(true);
      expect(navigation.state?.id).toBe("/c");
    });

    it("adopts a silently pushed foreign entry in place on the next navigate", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      mocks.history.pushState({ modal: true }, "");
      mocks.history.pushState.mockClear();

      expect(await navigation.navigate(route("/b"))).toBe(true);
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.getStack()).toEqual(["/", "/a", "/b"]);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
    });

    it("does not traverse from a foreign entry that cloned history.state", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      mocks.history.pushState(mocks.getHistoryState(), "", "/x");
      mocks.history.go.mockClear();

      expect(await navigation.goBack()).toBe(false);
      expect(mocks.history.go).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/x");

      await mocks.userBack();
      expect(navigation.state?.id).toBe("/a");
      expect(navigation.position).toBe(1);
      expect(await navigation.goBack()).toBe(true);
      expect(mocks.getUrl()).toBe("/");
    });

    it("resolves go() as not applied when a foreign push truncated the browser's forward entries", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      await navigation.navigate(route("/c"));
      await mocks.userBack();
      await mocks.userBack();
      await mocks.userBack();
      expect(navigation.position).toBe(0);

      mocks.history.pushState({ modal: true }, "");
      mocks.history.go(-1);
      await settle();
      expect(navigation.position).toBe(0);
      mocks.history.go.mockClear();

      const result = await Promise.race([
        navigation.go(2),
        settle().then(() => "hung" as const),
      ]);
      expect(result).toBe(false);
      expect(mocks.history.go).not.toHaveBeenCalled();
      expect(navigation.position).toBe(0);
    });

    it("runs the guard once and reverts once for a refused hash-only user Back", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      let allow = true;
      let calls = 0;
      navigation.router.addRoute({
        id: "/editor",
        canDeactivate: () => {
          calls++;
          return allow;
        },
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/editor"));
      await navigation.navigate(route("/editor", { hash: "#draft" }));
      allow = false;
      calls = 0;
      mocks.history.go.mockClear();

      await mocks.userBack();
      await settle();

      expect(calls).toBe(1);
      expect(mocks.history.go).toHaveBeenCalledTimes(1);
      expect(mocks.history.go).toHaveBeenCalledWith(1);
      expect(mocks.getUrl()).toBe("/editor#draft");
      expect(navigation.position).toBe(2);
    });

    it("keeps an app goForward issued from a Back listener alive across the trailing hashchange", async () => {
      const mocks = setupBrowser("/docs");
      const navigation = createNavigation({}, ["/"]);
      navigation.router.addRoute({
        id: "/docs",
        canActivate: async (to) => {
          if (to?.hash) return true;
          await tick();
          await tick();
          return true;
        },
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/docs", { hash: "#s" }));
      const events: NavigationType[] = [];
      const issued: Promise<boolean>[] = [];
      navigation.addListener(async (type) => {
        events.push(type);
        if (type !== NavigationType.Back) return;
        const goIssued = new Promise<void>((resolve) => {
          const go = mocks.history.go.getMockImplementation()!;
          mocks.history.go.mockImplementationOnce((delta: number) => {
            go(delta);
            resolve();
          });
        });
        issued.push(navigation.goForward());
        await goIssued;
      });

      await mocks.userBack();
      await settle();

      expect(issued).toHaveLength(1);
      expect(await issued[0]).toBe(true);
      expect(events).toEqual([NavigationType.Back, NavigationType.Forward]);
      expect(mocks.getUrl()).toBe("/docs#s");
      expect(navigation.position).toBe(1);
    });
  });

  describe("History API mode — dispose", () => {
    it("registers only once until disposed", async () => {
      const { mocks, navigation, browser } = await setup("/");
      await browser.registerRoutes();
      expect(navigation.entries.length).toBe(1);
      expect(mocks.window.addEventListener).toHaveBeenCalledTimes(4);
      browser.dispose();
      await browser.registerRoutes();
      expect(mocks.window.addEventListener).toHaveBeenCalledTimes(8);
      browser.dispose();
    });

    it("remembers the current entry across dispose and registerRoutes", async () => {
      const { mocks, navigation, browser, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      await settle();
      events.length = 0;
      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      browser.dispose();
      await browser.registerRoutes();
      await settle();

      expect(navigation.entries).toHaveLength(3);
      expect(navigation.position).toBe(2);
      expect(events).toEqual([]);
      expect(mocks.history.replaceState).not.toHaveBeenCalled();

      expect(await navigation.navigate(route("/c"))).toBe(true);
      expect(mocks.history.pushState).toHaveBeenCalledWith(
        { key: navigation.currentEntry!.key },
        "",
        "/c",
      );
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
      expect(mocks.getStack()).toEqual(["/", "/a", "/b", "/c"]);
      browser.dispose();
    });

    it("restores the previous scrollRestoration mode on dispose", async () => {
      const { mocks, navigation, browser } = await setup("/");
      await navigation.navigate(route("/a"));
      expect(mocks.history.scrollRestoration).toBe("manual");
      browser.dispose();
      expect(mocks.history.scrollRestoration).toBe("auto");
    });

    it("removes listeners and the adapter", async () => {
      const { mocks, navigation, browser } = await setup("/");
      browser.dispose();

      expect(mocks.window.removeEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
      expect(mocks.window.removeEventListener).toHaveBeenCalledWith(
        "hashchange",
        expect.any(Function),
      );

      await navigation.navigate(route("/a"));
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/");
    });
  });

  describe("Navigation API mode", () => {
    it("listens to navigate instead of popstate and restores with the browser key", async () => {
      const { mocks, navigation, events } = await setup("/docs?gclid=x", {
        navigationApi: true,
      });

      expect(mocks.navigation.addEventListener).toHaveBeenCalledWith(
        "navigate",
        expect.any(Function),
      );
      expect(mocks.window.addEventListener).not.toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        unknownQuery: "gclid=x",
      });
      expect(mocks.getUrl()).toBe("/docs?gclid=x");
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: null, to: "/docs" },
      ]);
    });

    it("routes a programmatic push through window.navigation and commits before listeners (M8/M11)", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      navigation.addListener(async () => {
        await tick();
        mocks.log.push(`render:${mocks.getUrl()}`);
      });

      expect(await navigation.navigate(route("/dashboard"))).toBe(true);
      expect(mocks.log).toEqual([]);
      await settle();

      expect(mocks.navigation.navigate).toHaveBeenCalledWith(
        "/dashboard",
        expect.objectContaining({ history: "push" }),
      );
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.log).toEqual(["render:/dashboard", "scroll-restore"]);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(mocks.navigateEvents).toEqual([
        expect.objectContaining({
          navigationType: "push",
          intercepted: true,
          prevented: false,
        }),
      ]);
      expect(navigation.position).toBe(1);
    });

    it("uses the current href for a push to the URL it is already on", async () => {
      const { mocks, navigation } = await setup("/dashboard?gclid=x", {
        navigationApi: true,
      });
      await navigation.navigate(route("/dashboard"));
      expect(mocks.navigation.navigate).toHaveBeenCalledWith(
        "/dashboard?gclid=x",
        expect.objectContaining({ history: "push" }),
      );
      expect(mocks.getStack()).toEqual([
        "/dashboard?gclid=x",
        "/dashboard?gclid=x",
      ]);
    });

    it("commits a same-route replace without a browser navigation", async () => {
      const { mocks, navigation } = await setup("/dashboard?gclid=x", {
        navigationApi: true,
      });
      const key = navigation.currentEntry!.key;
      await navigation.replace(route("/dashboard"));
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/dashboard?gclid=x");
      expect(navigation.currentEntry!.key).toBe(key);
    });

    it("routes a cross-route hash push through window.navigation", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      await navigation.navigate(route("/docs", { hash: "#section" }));
      expect(mocks.navigation.navigate).toHaveBeenCalledWith(
        "/docs#section",
        expect.objectContaining({ history: "push" }),
      );
      expect(mocks.navigateEvents.every((e) => e.intercepted)).toBe(true);
      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
    });

    it("moves the cursor on a user Back and traverses by key on goBack (A/B)", async () => {
      const { mocks, navigation, events } = await setup("/", {
        navigationApi: true,
      });
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      expect(mocks.getStates()).toEqual(
        navigation.entries.map((entry) => ({ key: entry.key })),
      );
      events.length = 0;

      await mocks.userBack();
      expect(navigation.position).toBe(1);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);
      expect(events).toEqual([
        { type: NavigationType.Back, from: "/b", to: "/a" },
      ]);

      await mocks.userBack();
      expect(await navigation.goBack()).toBe(false);

      expect(await navigation.goForward()).toBe(true);
      expect(mocks.navigation.traverseTo).toHaveBeenLastCalledWith(
        mocks.getKeys()[1],
        expect.objectContaining({ info: expect.any(Object) }),
      );
      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.state?.id).toBe("/a");
      expect(events.at(-1)).toEqual({
        type: NavigationType.Forward,
        from: "/",
        to: "/a",
      });
    });

    it("delays scroll restoration until the render completes on back/forward", async () => {
      const { mocks, navigation } = await setup("/dashboard", {
        navigationApi: true,
      });
      await navigation.navigate(route("/"));
      await settle();
      let release!: () => void;
      navigation.addListener((type) => {
        mocks.log.push(`render:${type}`);
        return type === NavigationType.Back
          ? new Promise<void>((resolve) => (release = resolve))
          : undefined;
      });
      mocks.log.length = 0;

      const back = mocks.userBack();
      await settle();
      expect(navigation.state).toEqual({ id: "/dashboard", params: {} });
      expect(mocks.log).toEqual(["render:back"]);

      release();
      await back;
      expect(mocks.log).toEqual(["render:back", "scroll-restore"]);
    });

    it("intercepts a hash-only traversal and leaves the scroll to the browser", async () => {
      const { mocks, navigation } = await setup("/docs#a", {
        navigationApi: true,
      });
      await navigation.navigate(route("/docs", { hash: "#b" }));
      const target = mocks.addElement("a");

      await mocks.userBack();

      expect(navigation.state).toEqual({ id: "/docs", params: {}, hash: "#a" });
      expect(target.scrollIntoView).not.toHaveBeenCalled();
      expect(mocks.scrollTo).not.toHaveBeenCalled();
    });

    it("keeps the scroll position and focus on an own replace and scrolls only to its fragment", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });

      await navigation.replace(route("/about"));
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          intercepted: true,
          manualScroll: true,
          manualFocus: true,
        }),
      );
      expect(mocks.log).toEqual([]);

      await navigation.replace(route("/about", { hash: "#section" }));
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          manualScroll: true,
          manualFocus: true,
        }),
      );
      expect(mocks.log).toEqual(["scroll-fragment"]);

      await navigation.navigate(route("/docs"));
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "push",
          manualScroll: false,
          manualFocus: false,
        }),
      );
      expect(mocks.log).toEqual(["scroll-fragment", "scroll-restore"]);
    });

    it("re-issues a replace to the current URL through the browser when the target has a fragment", async () => {
      const { mocks, navigation } = await setup("/docs#section", {
        navigationApi: true,
      });
      const key = navigation.currentEntry!.key;

      await navigation.replace(route("/docs", { hash: "#section" }));
      await settle();

      expect(mocks.navigation.navigate).toHaveBeenCalledWith(
        "/docs#section",
        expect.objectContaining({ history: "replace" }),
      );
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          intercepted: true,
          manualScroll: true,
        }),
      );
      expect(mocks.log).toEqual(["scroll-fragment"]);
      expect(mocks.getStack()).toEqual(["/docs#section"]);
      expect(navigation.currentEntry!.key).toBe(key);
      expect(mocks.getHistoryState()).toEqual({ key });
    });

    it.each(["push", "replace"] as const)(
      "leaves a scripted cross-document %s to a route URL to the browser",
      async (navigationType) => {
        const { mocks, navigation, events } = await setup("/", {
          navigationApi: true,
        });
        events.length = 0;

        mocks.dispatchNavigate({
          navigationType,
          url: "/a",
          sameDocument: false,
        });
        await settle();

        expect(mocks.navigateEvents.at(-1)).toEqual(
          expect.objectContaining({ prevented: false, intercepted: false }),
        );
        expect(navigation.state?.id).toBe("/");
        expect(events).toEqual([]);
      },
    );

    it("reverts a user traversal refused by a guard via traverseTo (G)", async () => {
      const mocks = setupBrowser("/", { navigationApi: true });
      const navigation = createNavigation();
      let allow = true;
      navigation.router.addRoute({ id: "/private", canActivate: () => allow });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/private"));
      await mocks.userBack();
      const aKey = mocks.getCurrentKey();
      allow = false;
      const events: string[] = [];
      navigation.addListener((type) => {
        events.push(type);
      });

      await mocks.userForward();
      await settle();

      expect(mocks.getUrl()).toBe("/a");
      expect(mocks.getCurrentKey()).toBe(aKey);
      expect(navigation.state?.id).toBe("/a");
      expect(navigation.position).toBe(1);
      expect(events).toEqual([]);
      expect(mocks.navigation.traverseTo).toHaveBeenLastCalledWith(
        aKey,
        expect.objectContaining({ info: expect.any(Object) }),
      );
    });

    it("intercepts a link click and runs guards before anything commits (M3/M9)", async () => {
      const mocks = setupBrowser("/", { navigationApi: true });
      const navigation = createNavigation();
      let allow = false;
      navigation.router.addRoute({ id: "/private", canActivate: () => allow });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      mocks.clickLink("/private");
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: true, intercepted: false }),
      );
      expect(mocks.getUrl()).toBe("/");
      expect(navigation.state?.id).toBe("/");
      expect(mocks.getStack()).toEqual(["/"]);

      allow = true;
      mocks.clickLink("/private");
      await settle();
      expect(mocks.getUrl()).toBe("/private");
      expect(navigation.state?.id).toBe("/private");
      expect(navigation.position).toBe(1);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(mocks.log).toEqual(["scroll-restore"]);
    });

    it("re-issues a user fragment navigation through the adapter", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
      });
      events.length = 0;
      mocks.location.hash = "#section";
      await settle();

      expect(navigation.state).toEqual({
        id: "/docs",
        params: {},
        hash: "#section",
      });
      expect(navigation.position).toBe(1);
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: "/docs", to: "/docs" },
      ]);
      expect(mocks.getStack()).toEqual(["/docs", "/docs#section"]);
    });

    it("leaves link clicks to the browser when interceptLinks is false", async () => {
      const { mocks, navigation } = await setup("/", {
        navigationApi: true,
        interceptLinks: false,
      });
      mocks.clickLink("/a");
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: false, intercepted: false }),
      );
      expect(navigation.state?.id).toBe("/");
    });

    it("leaves URLs that match no route to the browser", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      mocks.clickLink("/nowhere");
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: false, intercepted: false }),
      );
      expect(navigation.state?.id).toBe("/");
    });

    it.each([
      ["cross-document", { canIntercept: false }],
      ["download", { downloadRequest: "file.zip" }],
      ["form post", { formData: new FormData() }],
    ])("ignores %s navigations", async (_label, extra) => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      mocks.dispatchNavigate({ navigationType: "push", url: "/a", ...extra });
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: false, intercepted: false }),
      );
      expect(navigation.state?.id).toBe("/");
    });

    it("ignores reload navigations", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      mocks.dispatchNavigate({ navigationType: "reload", url: "/" });
      await settle();
      expect(mocks.navigateEvents.at(-1)!.intercepted).toBe(false);
      expect(navigation.position).toBe(0);
    });

    it("creates a null entry when traversing to an unknown URL (M10)", async () => {
      const { mocks, navigation, events } = await setup("/", {
        navigationApi: true,
      });
      const key = mocks.pushForeignEntry("/nowhere");
      await mocks.userBack();
      events.length = 0;

      await mocks.userTraverseTo(key);

      expect(navigation.state).toBeNull();
      expect(mocks.getCurrentKey()).toBe(key);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: "/", to: null },
      ]);
      expect(mocks.getUrl()).toBe("/nowhere");
    });

    it("does not echo a traversal to the entry it is already on", async () => {
      const { mocks, navigation, events } = await setup("/", {
        navigationApi: true,
      });
      await navigation.navigate(route("/a"));
      events.length = 0;
      await mocks.userTraverseTo(mocks.getCurrentKey());
      expect(events).toEqual([]);
      expect(navigation.position).toBe(1);
    });

    it("reports a navigation as not applied when window.navigation.navigate throws", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      mocks.navigation.navigate.mockImplementationOnce(() => {
        throw new DOMException("nope", "SecurityError");
      });
      expect(await navigation.navigate(route("/a"))).toBe(false);
      expect(mocks.history.pushState).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/");
      expect(navigation.state?.id).toBe("/");
      expect(navigation.history).toHaveLength(1);
    });

    it("does not intercept an own navigation another listener cancelled first", async () => {
      const mocks = setupBrowser("/", { navigationApi: true });
      mocks.navigation.addEventListener(
        "navigate",
        (event: { preventDefault: () => void }) => {
          event.preventDefault();
        },
      );
      const navigation = createNavigation();
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      expect(await navigation.navigate(route("/a"))).toBe(false);
      expect(mocks.errors).toEqual([]);
      expect(navigation.state?.id).toBe("/");
      expect(mocks.getUrl()).toBe("/");
    });

    it("lets a foreign same-URL replaceState through untouched", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
      });
      events.length = 0;
      const key = navigation.currentEntry!.key;

      mocks.history.replaceState({ foreign: 1 }, "", "/docs");
      await settle();

      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          prevented: false,
          intercepted: false,
        }),
      );
      expect(events).toEqual([]);
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();
      expect(navigation.currentEntry!.key).toBe(key);
      expect(mocks.getStack()).toEqual(["/docs"]);
    });

    it("adopts a foreign pushState post-commit without cancelling it or scrolling", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
      });
      events.length = 0;

      mocks.history.pushState({ modal: true }, "");
      await settle();

      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "push",
          prevented: false,
          intercepted: true,
          manualScroll: true,
        }),
      );
      expect(mocks.getStack()).toEqual(["/docs", "/docs"]);
      expect(navigation.history.map((s) => s?.id)).toEqual(["/docs", "/docs"]);
      expect(navigation.position).toBe(1);
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: "/docs", to: "/docs" },
      ]);
      expect(mocks.log).toEqual([]);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();

      await mocks.userBack();
      expect(navigation.position).toBe(0);
      expect(events.at(-1)).toEqual({
        type: NavigationType.Back,
        from: "/docs",
        to: "/docs",
      });
    });

    it("adopts a foreign pushState to another route and leaves unmatched ones to the browser", async () => {
      const { mocks, navigation, events } = await setup("/", {
        navigationApi: true,
      });
      events.length = 0;

      mocks.history.pushState(null, "", "/a");
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          prevented: false,
          intercepted: true,
          manualScroll: true,
        }),
      );
      expect(navigation.state?.id).toBe("/a");
      expect(navigation.position).toBe(1);

      mocks.history.pushState(null, "", "/nowhere");
      await settle();
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: false, intercepted: false }),
      );
      expect(navigation.state?.id).toBe("/a");
      expect(mocks.getStack()).toEqual(["/", "/a", "/nowhere"]);
    });

    it("falls back to the History API when the Navigation API has entries disabled", async () => {
      const mocks = setupBrowser("/", { navigationApi: true });
      Object.defineProperty(mocks.navigation, "currentEntry", {
        get: () => null,
        configurable: true,
      });
      const navigation = createNavigation();
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();

      expect(mocks.navigation.addEventListener).not.toHaveBeenCalled();
      expect(mocks.window.addEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
      browser.dispose();
    });

    it("still tracks user fragment navigations when interceptLinks is false", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
        interceptLinks: false,
      });
      events.length = 0;
      mocks.location.hash = "#x";
      await settle();

      expect(navigation.state).toEqual({ id: "/docs", params: {}, hash: "#x" });
      expect(mocks.getStates()).toEqual(
        navigation.entries.map((entry) => ({ key: entry.key })),
      );
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: "/docs", to: "/docs" },
      ]);

      await mocks.userBack();
      expect(navigation.state).toEqual({ id: "/docs", params: {} });
      expect(events.at(-1)).toEqual({
        type: NavigationType.Back,
        from: "/docs",
        to: "/docs",
      });
    });

    it("creates a browser entry for a programmatic null-state push", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      expect(await navigation.navigate(null)).toBe(true);
      expect(navigation.state).toBeNull();
      expect(mocks.getStates()).toEqual(
        navigation.entries.map((entry) => ({ key: entry.key })),
      );
      expect(mocks.getUrl()).toBe("/");
    });

    it("reports a navigation cancelled by another listener as not applied", async () => {
      const { mocks, navigation } = await setup("/", { navigationApi: true });
      mocks.navigation.addEventListener(
        "navigate",
        (event: { preventDefault: () => void }) => {
          event.preventDefault();
        },
      );
      expect(await navigation.navigate(route("/a"))).toBe(false);
      expect(navigation.state?.id).toBe("/");
      expect(mocks.getUrl()).toBe("/");
    });

    it("removes the navigate listener and adapter on dispose", async () => {
      const { mocks, navigation, browser } = await setup("/", {
        navigationApi: true,
      });
      browser.dispose();
      expect(mocks.navigation.removeEventListener).toHaveBeenCalledWith(
        "navigate",
        expect.any(Function),
      );
      await navigation.navigate(route("/a"));
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/");
    });

    it("re-seeds browser keys from entry state after dispose and re-register", async () => {
      const { mocks, navigation, browser } = await setup("/", {
        navigationApi: true,
      });
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      browser.dispose();
      await browser.registerRoutes();

      expect(navigation.entries).toHaveLength(3);
      expect(await navigation.goBack()).toBe(true);
      expect(mocks.navigation.traverseTo).toHaveBeenLastCalledWith(
        mocks.getKeys()[1],
        expect.objectContaining({ info: expect.any(Object) }),
      );
      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.state?.id).toBe("/a");
    });

    it("adopts a user fragment navigation on an unmatched URL as a null entry", async () => {
      const { mocks, navigation, events } = await setup("/nowhere", {
        navigationApi: true,
      });
      events.length = 0;
      mocks.location.hash = "#x";
      await settle();

      expect(navigation.state).toBeNull();
      expect(navigation.position).toBe(1);
      expect(mocks.getStack()).toEqual(["/nowhere", "/nowhere#x"]);
      expect(mocks.getHistoryState()).toEqual({
        key: navigation.currentEntry!.key,
      });
      expect(events).toEqual([
        { type: NavigationType.Navigate, from: null, to: null },
      ]);
      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({ prevented: false, intercepted: true }),
      );
    });
  });

  describe("Guard redirects", () => {
    async function setupRedirect(navigationApi: boolean) {
      const mocks = setupBrowser("/", { navigationApi });
      const navigation = createNavigation();
      let allow = true;
      navigation.router.addRoute({
        id: "/private",
        canActivate: async () => {
          if (allow) return true;
          await navigation.replace(route("/login"));
          return false;
        },
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/private"));
      await navigation.navigate(route("/a"));
      await settle();
      const events: Array<{
        type: NavigationType;
        from: string | null;
        to: string | null;
      }> = [];
      navigation.addListener((type, from, to) => {
        events.push({ type, from: from?.id ?? null, to: to?.id ?? null });
      });
      allow = false;
      mocks.log.length = 0;
      return { mocks, navigation, events, slotKey: navigation.entries[1]!.key };
    }

    const modes = [
      ["History API", false],
      ["Navigation API", true],
    ] as const;

    it.each(modes)(
      "rewrites the slot in place when a guard redirects an app goBack (%s)",
      async (_label, navigationApi) => {
        const { mocks, navigation, events, slotKey } =
          await setupRedirect(navigationApi);

        expect(await navigation.goBack()).toBe(false);
        await settle();

        expect(navigation.state?.id).toBe("/login");
        expect(navigation.position).toBe(1);
        expect(navigation.entries[1]!.key).toBe(slotKey);
        expect(navigation.history.map((s) => s?.id)).toEqual([
          "/",
          "/login",
          "/a",
        ]);
        expect(mocks.getStack()).toEqual(["/", "/login", "/a"]);
        expect(mocks.getUrl()).toBe("/login");
        expect(mocks.getHistoryState()).toEqual({ key: slotKey });
        expect(events).toEqual([
          { type: NavigationType.Back, from: "/a", to: "/login" },
        ]);
        if (navigationApi) {
          expect(mocks.navigation.traverseTo).toHaveBeenCalledTimes(1);
          expect(mocks.navigation.navigate).toHaveBeenLastCalledWith(
            "/login",
            expect.objectContaining({ history: "replace" }),
          );
          expect(mocks.log).toEqual(["scroll-restore"]);
        } else {
          expect(mocks.history.go).toHaveBeenCalledTimes(1);
          expect(mocks.history.replaceState).toHaveBeenLastCalledWith(
            { key: slotKey },
            "",
            "/login",
          );
        }
      },
    );

    it.each(modes)(
      "rewrites the landed entry when a guard redirects a user Back (%s)",
      async (_label, navigationApi) => {
        const { mocks, navigation, events, slotKey } =
          await setupRedirect(navigationApi);

        await mocks.userBack();

        expect(navigation.state?.id).toBe("/login");
        expect(navigation.position).toBe(1);
        expect(navigation.entries[1]!.key).toBe(slotKey);
        expect(navigation.history.map((s) => s?.id)).toEqual([
          "/",
          "/login",
          "/a",
        ]);
        expect(mocks.getStack()).toEqual(["/", "/login", "/a"]);
        expect(mocks.getUrl()).toBe("/login");
        expect(mocks.getHistoryState()).toEqual({ key: slotKey });
        expect(events).toEqual([
          { type: NavigationType.Back, from: "/a", to: "/login" },
        ]);
        expect(mocks.history.go).not.toHaveBeenCalled();
        expect(mocks.navigation.traverseTo).not.toHaveBeenCalled();
        if (navigationApi) {
          expect(mocks.log).toEqual(["scroll-restore"]);
        }
      },
    );
  });

  describe("Inbound traversals", () => {
    const modes = [
      ["History API", false],
      ["Navigation API", true],
    ] as const;

    it.each(modes)(
      "does not re-traverse to an inbound target the user already left (%s)",
      async (_label, navigationApi) => {
        const mocks = setupBrowser("/", { navigationApi });
        const navigation = createNavigation();
        let slow = false;
        let release!: (allow: boolean) => void;
        navigation.router.addRoute({
          id: "/slow",
          canActivate: () =>
            slow
              ? new Promise<boolean>((resolve) => (release = resolve))
              : true,
        });
        const browser = new BrowserNavigation(navigation);
        await browser.registerRoutes();
        await navigation.navigate(route("/slow"));
        await navigation.navigate(route("/b"));
        slow = true;
        const events: string[] = [];
        navigation.addListener((type, _from, to) => {
          events.push(`${type}:${to?.id}`);
        });
        mocks.history.go.mockClear();
        mocks.navigation.traverseTo.mockClear();

        const back = mocks.userBack();
        await tick();
        const forward = mocks.userForward();
        await tick();
        release(true);
        await back;
        await forward;
        await settle();

        expect(mocks.getUrl()).toBe("/b");
        expect(navigation.state?.id).toBe("/b");
        expect(navigation.position).toBe(2);
        expect(events).toEqual([]);
        expect(mocks.history.go).not.toHaveBeenCalled();
        expect(mocks.navigation.traverseTo).not.toHaveBeenCalled();
      },
    );

    it.each(modes)(
      "reverts the browser when a guard throws during a user traversal (%s)",
      async (_label, navigationApi) => {
        const mocks = setupBrowser("/", { navigationApi });
        const navigation = createNavigation();
        let boom = false;
        navigation.router.addRoute({
          id: "/editor",
          canDeactivate: () => {
            if (boom) throw new Error("boom");
            return true;
          },
        });
        const browser = new BrowserNavigation(navigation);
        await browser.registerRoutes();
        await navigation.navigate(route("/editor"));
        boom = true;
        const errorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        await mocks.userBack();
        await settle();

        expect(mocks.getUrl()).toBe("/editor");
        expect(navigation.state?.id).toBe("/editor");
        expect(navigation.position).toBe(1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        errorSpy.mockRestore();
      },
    );

    it.each(modes)(
      "hydrates a setState entry in place on registerRoutes (%s)",
      async (_label, navigationApi) => {
        const mocks = setupBrowser("/docs", { navigationApi });
        const navigation = createNavigation();
        navigation.setState(0, [route("/docs")]);
        const events: NavigationType[] = [];
        navigation.addListener((type) => {
          events.push(type);
        });
        const browser = new BrowserNavigation(navigation);
        await browser.registerRoutes();

        expect(navigation.history.map((s) => s?.id)).toEqual(["/docs"]);
        expect(navigation.position).toBe(0);
        expect(navigation.canGoBack).toBe(false);
        expect(events).toEqual([NavigationType.Replace]);
        expect(mocks.getHistoryState()).toEqual({
          key: navigation.currentEntry!.key,
        });
        expect(mocks.getStack()).toEqual(["/docs"]);
        expect(await navigation.goBack()).toBe(false);
      },
    );

    it.each(modes)(
      "leaves the fragment of the document as loaded to the browser on hydration (%s)",
      async (_label, navigationApi) => {
        const mocks = setupBrowser("/docs#x", { navigationApi });
        const navigation = createNavigation();
        navigation.setState(0, [route("/docs", { hash: "#x" })]);
        const el = mocks.addElement("x");
        const events: NavigationType[] = [];
        navigation.addListener((type) => {
          events.push(type);
        });
        const browser = new BrowserNavigation(navigation);
        await browser.registerRoutes();
        await settle();

        expect(events).toEqual([NavigationType.Replace]);
        expect(navigation.state).toEqual({
          id: "/docs",
          params: {},
          hash: "#x",
        });
        expect(el.scrollIntoView).not.toHaveBeenCalled();
        expect(mocks.scrollTo).not.toHaveBeenCalled();
        expect(mocks.navigation.navigate).not.toHaveBeenCalled();
        expect(mocks.log).toEqual([]);
        expect(mocks.getStack()).toEqual(["/docs#x"]);
        expect(mocks.getHistoryState()).toEqual({
          key: navigation.currentEntry!.key,
        });

        await navigation.replace(route("/docs", { hash: "#x" }));
        await settle();
        if (navigationApi) {
          expect(mocks.log).toEqual(["scroll-fragment"]);
        } else {
          expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
        }
      },
    );

    it.each(modes)(
      "leaves the fragment of the document as loaded to the browser on the initial adopt (%s)",
      async (_label, navigationApi) => {
        const mocks = setupBrowser("/docs#x", { navigationApi });
        const navigation = createNavigation();
        const el = mocks.addElement("x");
        const browser = new BrowserNavigation(navigation);
        await browser.registerRoutes();
        await settle();

        expect(navigation.state).toEqual({
          id: "/docs",
          params: {},
          hash: "#x",
        });
        expect(el.scrollIntoView).not.toHaveBeenCalled();
        expect(mocks.scrollTo).not.toHaveBeenCalled();
        expect(mocks.navigation.navigate).not.toHaveBeenCalled();
        expect(mocks.log).toEqual([]);
        expect(mocks.getStack()).toEqual(["/docs#x"]);
      },
    );
  });

  describe("P1 — inbound traversal the user already left", () => {
    async function setupSlow() {
      const mocks = setupBrowser("/");
      const navigation = createNavigation({}, ["/", "/b", "/c"]);
      let armed = false;
      let release!: (allow: boolean) => void;
      navigation.router.addRoute({
        id: "/slow",
        canActivate: () =>
          armed ? new Promise<boolean>((resolve) => (release = resolve)) : true,
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      const events: string[] = [];
      const arm = () => {
        armed = true;
        navigation.addListener((type, _from, to) => {
          events.push(`${type}:${to?.id}`);
        });
        mocks.history.go.mockClear();
      };
      return {
        mocks,
        navigation,
        events,
        arm,
        release: (allow: boolean) => release(allow),
      };
    }

    it.each([
      ["allowed", true],
      ["refused", false],
    ])(
      "P1: follows a second user Back issued while the first was guarded (%s)",
      async (_label, allow) => {
        const { mocks, navigation, events, arm, release } = await setupSlow();
        await navigation.navigate(route("/slow"));
        await navigation.navigate(route("/b"));
        arm();

        const first = mocks.userBack();
        await tick();
        const second = mocks.userBack();
        await tick();
        release(allow);
        await first;
        await second;
        await settle();

        expect(mocks.getUrl()).toBe("/");
        expect(navigation.position).toBe(0);
        expect(navigation.state?.id).toBe("/");
        expect(mocks.history.go).not.toHaveBeenCalled();
        expect(events).toEqual(["back:/"]);
        expect(mocks.errors).toEqual([]);
      },
    );

    it("P1: realigns to the last user traversal past the origin", async () => {
      const { mocks, navigation, events, arm, release } = await setupSlow();
      await navigation.navigate(route("/slow"));
      await navigation.navigate(route("/b"));
      await navigation.navigate(route("/c"));
      await mocks.userBack();
      expect(navigation.state?.id).toBe("/b");
      arm();

      const back = mocks.userBack();
      await tick();
      const forward = mocks.userForward();
      await tick();
      const past = mocks.userForward();
      await tick();
      release(true);
      await back;
      await forward;
      await past;
      await settle();

      expect(mocks.getUrl()).toBe("/c");
      expect(navigation.position).toBe(3);
      expect(navigation.state?.id).toBe("/c");
      expect(mocks.history.go).not.toHaveBeenCalled();
      expect(events).toEqual(["forward:/c"]);
    });
  });

  describe("P2 — history drift", () => {
    it("P2: resolves goForward false after an equal-length foreign push that cloned history.state", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      await mocks.userBack();
      mocks.history.go.mockClear();
      mocks.history.pushState(mocks.getHistoryState(), "", "/x");
      expect(mocks.getStack()).toEqual(["/", "/a", "/x"]);

      vi.useFakeTimers();
      const forward = navigation.goForward();
      await vi.advanceTimersByTimeAsync(2500);
      expect(await forward).toBe(false);
      await vi.advanceTimersByTimeAsync(2500);
      vi.useRealTimers();

      expect(mocks.history.go).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/x");
      expect(navigation.position).toBe(1);
      expect(navigation.state?.id).toBe("/a");
    });

    it("P2: settles a traversal the browser never answers within the safety timeout", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      await mocks.userBack();
      events.length = 0;
      mocks.history.go.mockClear();
      mocks.history.pushState(mocks.getHistoryState(), "", mocks.getUrl());
      expect(mocks.getStack()).toEqual(["/", "/a", "/a"]);

      vi.useFakeTimers();
      const forward = navigation.goForward();
      let settled = false;
      void forward.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(1999);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await forward).toBe(false);
      vi.useRealTimers();

      expect(mocks.history.go).toHaveBeenCalledTimes(1);
      expect(navigation.position).toBe(1);
      expect(navigation.state?.id).toBe("/a");
      expect(events).toEqual([]);

      await mocks.userBack();
      expect(mocks.getUrl()).toBe("/a");
      expect(navigation.position).toBe(1);
      expect(events).toEqual([]);
      expect(mocks.errors).toEqual([]);
    });

    it("P2: realigns through an ordinary sync when the popstate lands after the safety timeout", async () => {
      const { mocks, navigation, events } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      await mocks.userBack();
      events.length = 0;
      const go = mocks.history.go.getMockImplementation()!;
      mocks.history.go.mockImplementationOnce((delta: number) => {
        setTimeout(() => go(delta), 2500);
      });

      vi.useFakeTimers();
      const forward = navigation.goForward();
      await vi.advanceTimersByTimeAsync(2000);
      expect(await forward).toBe(false);
      expect(navigation.position).toBe(1);
      await vi.advanceTimersByTimeAsync(1000);
      vi.useRealTimers();
      await settle();

      expect(mocks.getUrl()).toBe("/b");
      expect(navigation.position).toBe(2);
      expect(navigation.state?.id).toBe("/b");
      expect(events).toEqual([
        { type: NavigationType.Forward, from: "/a", to: "/b" },
      ]);
      expect(mocks.history.go).toHaveBeenCalledTimes(1);
    });

    it("P2: keeps the current entry across an iframe-style history.length bump", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      await navigation.navigate(route("/b"));
      mocks.bumpLength();
      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      expect(await navigation.navigate(route("/c"))).toBe(true);

      expect(mocks.history.pushState).toHaveBeenCalledTimes(1);
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
      expect(mocks.getStack()).toEqual(["/", "/a", "/b", "/c"]);
      expect(navigation.history.map((s) => s?.id)).toEqual([
        "/",
        "/a",
        "/b",
        "/c",
      ]);
      expect(mocks.getStates()).toEqual(
        navigation.entries.map((entry) => ({ key: entry.key })),
      );
      expect(await navigation.goBack()).toBe(true);
      expect(mocks.getUrl()).toBe("/b");
      expect(navigation.state?.id).toBe("/b");
    });

    it("P2: keeps the current entry when a foreign replaceState only strips undeclared query params", async () => {
      const { mocks, navigation } = await setup("/docs?gclid=x");
      mocks.history.replaceState(mocks.getHistoryState(), "", "/docs");
      mocks.history.pushState.mockClear();
      mocks.history.replaceState.mockClear();

      expect(await navigation.navigate(route("/a"))).toBe(true);

      expect(mocks.history.pushState).toHaveBeenCalledTimes(1);
      expect(mocks.history.replaceState).not.toHaveBeenCalled();
      expect(mocks.getStack()).toEqual(["/docs", "/a"]);
      expect(await navigation.goBack()).toBe(true);
      expect(mocks.getUrl()).toBe("/docs");
      expect(navigation.state?.id).toBe("/docs");
    });
  });

  describe("P3 — trailing hashchange of an own revert", () => {
    it("P3: runs an async guard once and reverts once for a refused hash-only user Back", async () => {
      const mocks = setupBrowser("/");
      const navigation = createNavigation();
      let allow = true;
      let calls = 0;
      navigation.router.addRoute({
        id: "/editor",
        canDeactivate: async () => {
          calls++;
          await tick();
          return allow;
        },
      });
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      await navigation.navigate(route("/editor"));
      await navigation.navigate(route("/editor", { hash: "#draft" }));
      const events: NavigationType[] = [];
      navigation.addListener((type) => {
        events.push(type);
      });
      allow = false;
      calls = 0;
      mocks.history.go.mockClear();

      await mocks.userBack();
      await settle();

      expect(calls).toBe(1);
      expect(mocks.history.go).toHaveBeenCalledTimes(1);
      expect(mocks.history.go).toHaveBeenCalledWith(1);
      expect(mocks.getUrl()).toBe("/editor#draft");
      expect(navigation.position).toBe(2);
      expect(navigation.state).toEqual({
        id: "/editor",
        params: {},
        hash: "#draft",
      });
      expect(events).toEqual([]);
      expect(mocks.errors).toEqual([]);
    });
  });

  describe("P4 — user-initiated same-URL replace", () => {
    it("P4: handles a user-initiated same-URL replace in-app", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
      });
      events.length = 0;
      const key = navigation.currentEntry!.key;

      mocks.dispatchNavigate({
        navigationType: "replace",
        url: "/docs",
        userInitiated: true,
      });
      await settle();

      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          prevented: true,
          intercepted: false,
        }),
      );
      expect(events).toEqual([
        { type: NavigationType.Replace, from: "/docs", to: "/docs" },
      ]);
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();
      expect(mocks.getUrl()).toBe("/docs");
      expect(navigation.currentEntry!.key).toBe(key);
      expect(navigation.position).toBe(0);
      expect(mocks.getStack()).toEqual(["/docs"]);
      expect(mocks.errors).toEqual([]);
    });

    it("P4: still leaves a scripted same-URL replace untouched", async () => {
      const { mocks, navigation, events } = await setup("/docs", {
        navigationApi: true,
      });
      events.length = 0;
      const key = navigation.currentEntry!.key;

      mocks.dispatchNavigate({ navigationType: "replace", url: "/docs" });
      await settle();

      expect(mocks.navigateEvents.at(-1)).toEqual(
        expect.objectContaining({
          navigationType: "replace",
          prevented: false,
          intercepted: false,
        }),
      );
      expect(events).toEqual([]);
      expect(mocks.navigation.navigate).not.toHaveBeenCalled();
      expect(navigation.currentEntry!.key).toBe(key);
    });
  });

  describe("P5 — scroll restoration ownership", () => {
    it("P5: leaves scrollRestoration untouched until the first own entry-changing write", async () => {
      const { mocks, navigation } = await setup("/");
      expect(mocks.history.scrollRestoration).toBe("auto");

      await navigation.replace(route("/"));
      expect(mocks.history.scrollRestoration).toBe("auto");

      mocks.fire("pageshow", { persisted: true });
      expect(mocks.history.scrollRestoration).toBe("auto");

      await navigation.navigate(route("/a"));
      expect(mocks.history.scrollRestoration).toBe("manual");
    });

    it("P5: takes over on a cross-route replace", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.replace(route("/about"));
      expect(mocks.history.scrollRestoration).toBe("manual");
    });

    it("P5: takes over on an app traversal between user-created entries", async () => {
      const { mocks, navigation } = await setup("/docs");
      mocks.location.hash = "#section";
      await settle();
      expect(navigation.position).toBe(1);
      expect(mocks.history.scrollRestoration).toBe("auto");

      expect(await navigation.goBack()).toBe(true);
      expect(mocks.history.scrollRestoration).toBe("manual");
      await settle();
    });

    it("P5: hands scroll restoration back on pagehide and takes it again on a persisted pageshow", async () => {
      const { mocks, navigation } = await setup("/");
      await navigation.navigate(route("/a"));
      expect(mocks.history.scrollRestoration).toBe("manual");

      mocks.fire("pagehide", { persisted: true });
      expect(mocks.history.scrollRestoration).toBe("auto");

      mocks.fire("pageshow", { persisted: true });
      expect(mocks.history.scrollRestoration).toBe("manual");

      mocks.fire("pagehide", { persisted: false });
      expect(mocks.history.scrollRestoration).toBe("auto");

      mocks.fire("pageshow", { persisted: false });
      expect(mocks.history.scrollRestoration).toBe("auto");
    });

    it("P5: ends with the mode the page had before attach when disposed after a post-reload attach", async () => {
      const mocks = setupBrowser("/");
      mocks.history.scrollRestoration = "manual";
      const navigation = createNavigation();
      const browser = new BrowserNavigation(navigation);
      await browser.registerRoutes();
      expect(mocks.history.scrollRestoration).toBe("manual");

      await navigation.navigate(route("/a"));
      mocks.fire("pagehide", { persisted: false });
      expect(mocks.history.scrollRestoration).toBe("manual");

      browser.dispose();
      expect(mocks.history.scrollRestoration).toBe("manual");
      expect(mocks.window.removeEventListener).toHaveBeenCalledWith(
        "pagehide",
        expect.any(Function),
      );
      expect(mocks.window.removeEventListener).toHaveBeenCalledWith(
        "pageshow",
        expect.any(Function),
      );
    });

    it("P5: lets the browser restore the initial entry natively across a reload", async () => {
      const mocks = setupBrowser("/");
      const previous = createNavigation();
      const first = new BrowserNavigation(previous);
      await first.registerRoutes();
      await previous.navigate(route("/a"));
      expect(mocks.history.scrollRestoration).toBe("manual");
      mocks.fire("pagehide", { persisted: false });
      expect(mocks.history.scrollRestoration).toBe("auto");

      const navigation = createNavigation();
      const second = new BrowserNavigation(navigation);
      await second.registerRoutes();
      expect(mocks.history.scrollRestoration).toBe("auto");
      await navigation.navigate(route("/b"));
      expect(mocks.history.scrollRestoration).toBe("manual");
      second.dispose();
      expect(mocks.history.scrollRestoration).toBe("auto");
    });
  });
});
