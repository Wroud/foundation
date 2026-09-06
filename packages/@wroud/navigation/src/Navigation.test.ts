import { describe, it, expect, vi, afterEach } from "vitest";
import { Navigation } from "./Navigation.js";
import { NavigationType } from "./NavigationListener.js";
import type {
  INavigationPlatform,
  NavigationTransition,
} from "./INavigationPlatform.js";
import type { IRouteState } from "./IRouteState.js";

function createNavigation() {
  const navigation = new Navigation();
  navigation.router.addRoute({ id: "/" });
  navigation.router.addRoute({ id: "/a" });
  navigation.router.addRoute({ id: "/b" });
  navigation.router.addRoute({ id: "/c" });
  navigation.router.addRoute({ id: "/login" });
  return navigation;
}

const route = (id: string): IRouteState => ({ id, params: {} });

interface RecordedTransition {
  type: NavigationType;
  index: number;
  fromKey: string | null;
  toKey: string;
  toId: string | null;
}

function recordingPlatform(
  commit: (
    transition: NavigationTransition<IRouteState>,
  ) => boolean | Promise<boolean> = () => true,
) {
  const calls: RecordedTransition[] = [];
  const transitions: NavigationTransition<IRouteState>[] = [];
  const platform: INavigationPlatform<IRouteState> = {
    commit(transition) {
      transitions.push(transition);
      calls.push({
        type: transition.type,
        index: transition.index,
        fromKey: transition.from?.key ?? null,
        toKey: transition.to.key,
        toId: transition.to.state?.id ?? null,
      });
      return commit(transition);
    },
  };
  return { platform, calls, transitions };
}

describe("Navigation listener error isolation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps notifying remaining listeners when one throws and does not reject navigate", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const navigation = createNavigation();

    const calls: string[] = [];
    navigation.addListener(() => {
      calls.push("first");
      throw new Error("boom");
    });
    navigation.addListener(() => {
      calls.push("second");
    });

    await expect(navigation.navigate(route("/a"))).resolves.toBe(true);

    expect(calls).toEqual(["first", "second"]);
    expect(navigation.state).toEqual({ id: "/a", params: {} });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("isolates async listener rejections across replace and goBack", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const navigation = createNavigation();

    const calls: string[] = [];
    navigation.addListener(async () => {
      calls.push("first");
      throw new Error("boom");
    });
    navigation.addListener(async () => {
      calls.push("second");
    });

    await navigation.navigate(route("/a"));
    await navigation.replace(route("/b"));
    await navigation.navigate(route("/a"));
    await navigation.goBack();

    expect(navigation.state).toEqual({ id: "/b", params: {} });
    expect(calls).toEqual([
      "first",
      "second",
      "first",
      "second",
      "first",
      "second",
      "first",
      "second",
    ]);
  });
});

describe("Navigation cursor model", () => {
  it("starts empty", () => {
    const navigation = createNavigation();
    expect(navigation.position).toBe(-1);
    expect(navigation.state).toBeNull();
    expect(navigation.currentEntry).toBeNull();
    expect(navigation.entries).toEqual([]);
    expect(navigation.canGoBack).toBe(false);
    expect(navigation.canGoForward).toBe(false);
  });

  it("pushes entries and truncates forward entries on navigate", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);
    expect(navigation.position).toBe(2);

    await navigation.goBack();
    await navigation.goBack();
    expect(navigation.position).toBe(0);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);

    await navigation.navigate(route("/c"));
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/c"]);
    expect(navigation.position).toBe(1);
  });

  it("moves the cursor with goBack/goForward without changing entries", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));

    const types: NavigationType[] = [];
    navigation.addListener((type) => {
      types.push(type);
    });

    expect(await navigation.goBack()).toBe(true);
    expect(navigation.state?.id).toBe("/a");
    expect(navigation.canGoBack).toBe(true);
    expect(navigation.canGoForward).toBe(true);

    expect(await navigation.goForward()).toBe(true);
    expect(navigation.state?.id).toBe("/b");
    expect(navigation.canGoForward).toBe(false);

    expect(await navigation.goForward()).toBe(false);
    expect(navigation.position).toBe(2);

    expect(await navigation.go(-2)).toBe(true);
    expect(navigation.state?.id).toBe("/");
    expect(await navigation.goBack()).toBe(false);
    expect(await navigation.go(5)).toBe(false);

    expect(types).toEqual([
      NavigationType.Back,
      NavigationType.Forward,
      NavigationType.Back,
    ]);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a", "/b"]);
  });

  it("treats go(0) as a no-op that only succeeds with a current entry", async () => {
    const navigation = createNavigation();
    expect(await navigation.go(0)).toBe(false);
    expect(await navigation.goBack()).toBe(false);
    expect(await navigation.traverseTo("missing")).toBe(false);

    await navigation.navigate(route("/"));
    const listener = vi.fn();
    navigation.addListener(listener);
    expect(await navigation.go(0)).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("traverses to an entry by key and is a no-op for the current key", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    const homeKey = navigation.currentEntry!.key;
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));

    const notified = vi.fn();
    navigation.addListener(notified);

    expect(await navigation.traverseTo(homeKey)).toBe(true);
    expect(navigation.state?.id).toBe("/");
    expect(notified).toHaveBeenCalledTimes(1);

    expect(await navigation.traverseTo(homeKey)).toBe(true);
    expect(notified).toHaveBeenCalledTimes(1);

    expect(await navigation.traverseTo("missing")).toBe(false);
  });

  it("assigns a unique key to every pushed entry", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));

    const keys = navigation.entries.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(3);
    expect(keys.every((key) => typeof key === "string" && key.length > 0)).toBe(
      true,
    );
  });

  it("replace keeps the current key and acts like push on empty history", async () => {
    const navigation = createNavigation();
    expect(await navigation.replace(route("/"))).toBe(true);
    expect(navigation.position).toBe(0);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/"]);
    const key = navigation.currentEntry!.key;

    await navigation.replace(route("/a"));
    expect(navigation.currentEntry!.key).toBe(key);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/a"]);
  });

  it("supports null entries", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(null)).toBe(true);
    expect(navigation.state).toBeNull();
    expect(navigation.position).toBe(1);
    expect(navigation.history).toEqual([{ id: "/", params: {} }, null]);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Navigate,
      { id: "/", params: {} },
      null,
    );

    await navigation.goBack();
    expect(navigation.state?.id).toBe("/");
  });

  it("setState rebuilds entries with fresh keys", async () => {
    const navigation = createNavigation();
    navigation.setState(1, [route("/"), route("/a")]);
    expect(navigation.state?.id).toBe("/a");
    expect(navigation.position).toBe(1);
    expect(navigation.entries.map((entry) => entry.key)).toHaveLength(2);
    expect(await navigation.goBack()).toBe(true);
    expect(navigation.state?.id).toBe("/");
  });

  it("throws for unknown routes", async () => {
    const navigation = createNavigation();
    await expect(navigation.navigate(route("/nope"))).rejects.toThrow(
      "Route /nope not found",
    );
  });
});

describe("Navigation guards", () => {
  it("refused canActivate returns false without moving or notifying", async () => {
    const navigation = createNavigation();
    navigation.router.addRoute({ id: "/private", canActivate: () => false });
    await navigation.navigate(route("/"));
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(await navigation.replace(route("/private"))).toBe(false);
    expect(navigation.state?.id).toBe("/");
    expect(navigation.history).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("refused canDeactivate blocks traversal in both directions", async () => {
    const navigation = createNavigation();
    let locked = false;
    navigation.router.addRoute({
      id: "/editor",
      canDeactivate: async () => !locked,
    });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/editor"));
    await navigation.navigate(route("/a"));
    await navigation.goBack();
    expect(navigation.state?.id).toBe("/editor");

    locked = true;
    expect(await navigation.goBack()).toBe(false);
    expect(await navigation.goForward()).toBe(false);
    expect(await navigation.navigate(route("/b"))).toBe(false);
    expect(navigation.state?.id).toBe("/editor");

    locked = false;
    expect(await navigation.goBack()).toBe(true);
    expect(navigation.state?.id).toBe("/");
  });

  it("passes to/from to guards on traversal", async () => {
    const navigation = createNavigation();
    const canActivate = vi.fn(() => true);
    const canDeactivate = vi.fn(() => true);
    navigation.router.addRoute({ id: "/x", canActivate, canDeactivate });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/x"));
    await navigation.goBack();
    await navigation.goForward();

    expect(canDeactivate).toHaveBeenCalledWith(
      { id: "/", params: {} },
      { id: "/x", params: {} },
    );
    expect(canActivate).toHaveBeenLastCalledWith(
      { id: "/x", params: {} },
      { id: "/", params: {} },
    );
  });

  it("resolves false when the traversal target changed during the guard phase", async () => {
    const navigation = createNavigation();
    let release!: (allowed: boolean) => void;
    navigation.router.addRoute({
      id: "/x",
      canDeactivate: () =>
        new Promise<boolean>((resolve) => (release = resolve)),
    });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/x"));
    const listener = vi.fn();
    navigation.addListener(listener);

    const back = navigation.goBack();
    navigation.setState(1, [route("/"), route("/x")]);
    release(true);

    expect(await back).toBe(false);
    expect(navigation.position).toBe(1);
    expect(navigation.state?.id).toBe("/x");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("Navigation platform", () => {
  it("routes every transition through the platform until it is uninstalled", async () => {
    const navigation = createNavigation();
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/"))).toBe(true);
    const homeKey = navigation.currentEntry!.key;
    expect(await navigation.navigate(route("/a"))).toBe(true);
    const aKey = navigation.currentEntry!.key;
    expect(await navigation.replace(route("/b"))).toBe(true);
    expect(await navigation.goBack()).toBe(true);
    expect(await navigation.goForward()).toBe(true);

    expect(calls).toEqual([
      {
        type: NavigationType.Navigate,
        index: 0,
        fromKey: null,
        toKey: homeKey,
        toId: "/",
      },
      {
        type: NavigationType.Navigate,
        index: 1,
        fromKey: homeKey,
        toKey: aKey,
        toId: "/a",
      },
      {
        type: NavigationType.Replace,
        index: 1,
        fromKey: aKey,
        toKey: aKey,
        toId: "/b",
      },
      {
        type: NavigationType.Back,
        index: 0,
        fromKey: aKey,
        toKey: homeKey,
        toId: "/",
      },
      {
        type: NavigationType.Forward,
        index: 1,
        fromKey: homeKey,
        toKey: aKey,
        toId: "/b",
      },
    ]);
    expect(listener).toHaveBeenCalledTimes(5);
    expect(navigation.state?.id).toBe("/b");

    navigation.setPlatform(null);
    expect(await navigation.navigate(route("/c"))).toBe(true);
    expect(calls).toHaveLength(5);
    expect(navigation.state?.id).toBe("/c");
  });

  it("resolves false without placing or notifying when commit vetoes", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    const keys = navigation.entries.map((entry) => entry.key);
    const { platform, calls, transitions } = recordingPlatform(() => false);
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.goBack()).toBe(false);
    expect(await navigation.navigate(route("/b"))).toBe(false);
    expect(await navigation.replace(route("/c"))).toBe(false);

    expect(calls.map((call) => call.type)).toEqual([
      NavigationType.Back,
      NavigationType.Navigate,
      NavigationType.Replace,
    ]);
    expect(navigation.state?.id).toBe("/a");
    expect(navigation.position).toBe(1);
    expect(navigation.entries.map((entry) => entry.key)).toEqual(keys);
    expect(listener).not.toHaveBeenCalled();
    await expect(transitions[0]!.finished).resolves.toBe(false);
  });

  it("commits before applying and notifying", async () => {
    const navigation = createNavigation();
    const seen: string[] = [];
    const { platform } = recordingPlatform(() => {
      seen.push(
        `commit:${navigation.state?.id ?? "none"}:${navigation.position}`,
      );
      return true;
    });
    navigation.setPlatform(platform);
    navigation.addListener(() => {
      seen.push(`listener:${navigation.state?.id}:${navigation.position}`);
    });

    await navigation.navigate(route("/a"));
    seen.push(`after:${navigation.state?.id}:${navigation.position}`);
    await navigation.navigate(route("/b"));
    await navigation.goBack();

    expect(seen).toEqual([
      "commit:none:-1",
      "listener:/a:0",
      "after:/a:0",
      "commit:/a:0",
      "listener:/b:1",
      "commit:/b:1",
      "listener:/a:0",
    ]);
  });

  it("waits for an asynchronous commit", async () => {
    const navigation = createNavigation();
    const seen: string[] = [];
    const { platform } = recordingPlatform(async () => {
      await Promise.resolve();
      await Promise.resolve();
      seen.push("committed");
      return true;
    });
    navigation.setPlatform(platform);
    navigation.addListener(() => {
      seen.push("listener");
    });

    expect(await navigation.navigate(route("/a"))).toBe(true);
    expect(seen).toEqual(["committed", "listener"]);
  });

  it("resolves finished after listeners ran", async () => {
    const navigation = createNavigation();
    const order: string[] = [];
    const { platform, transitions } = recordingPlatform((transition) => {
      void transition.finished.then(() => order.push("finished"));
      order.push("commit");
      return true;
    });
    navigation.setPlatform(platform);
    navigation.addListener(async () => {
      await Promise.resolve();
      order.push("listener");
    });

    await navigation.navigate(route("/a"));
    await expect(transitions[0]!.finished).resolves.toBe(true);
    expect(order).toEqual(["commit", "listener", "finished"]);
  });

  it("invokes every listener in the apply tick even when an earlier one is pending", async () => {
    const navigation = createNavigation();
    const order: string[] = [];
    let release!: () => void;
    navigation.addListener(
      () =>
        new Promise<void>((resolve) => {
          order.push("slow");
          release = resolve;
        }),
    );
    navigation.addListener(() => {
      order.push("fast");
    });

    expect(await navigation.navigate(route("/a"))).toBe(true);
    expect(order).toEqual(["slow", "fast"]);
    release();
  });

  it("resolves navigate() at apply and finished once the listeners settled", async () => {
    const navigation = createNavigation();
    const { platform, transitions } = recordingPlatform();
    navigation.setPlatform(platform);
    let release!: () => void;
    navigation.addListener(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const order: string[] = [];

    const call = navigation.navigate(route("/a")).then((applied) => {
      order.push(`navigate:${applied}`);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    void transitions[0]!.finished.then((applied) => {
      order.push(`finished:${applied}`);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(navigation.state?.id).toBe("/a");
    expect(order).toEqual(["navigate:true"]);

    release();
    await call;
    await expect(transitions[0]!.finished).resolves.toBe(true);
    expect(order).toEqual(["navigate:true", "finished:true"]);
  });

  it("resolves a guarded call at its redirect's apply, not after the listeners", async () => {
    const navigation = createNavigation();
    const { platform, transitions } = recordingPlatform();
    navigation.setPlatform(platform);
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        await navigation.replace(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));
    let release!: () => void;
    navigation.addListener(
      () => new Promise<void>((resolve) => (release = resolve)),
    );

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    release();
    await expect(transitions[1]!.finished).resolves.toBe(true);
  });

  it("serializes a navigate() issued while another transition is committing", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));
    const bKey = navigation.currentEntry!.key;
    await navigation.goBack();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { platform, calls, transitions } = recordingPlatform(
      async (transition) => {
        if (transition.type === NavigationType.Forward) await gate;
        return true;
      },
    );
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    const forward = navigation.goForward();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const push = navigation.navigate(route("/c"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(transitions).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
    release();

    expect(await forward).toBe(true);
    expect(await push).toBe(true);
    await expect(transitions[0]!.finished).resolves.toBe(true);
    await expect(transitions[1]!.finished).resolves.toBe(true);
    expect(calls[1]).toEqual({
      type: NavigationType.Navigate,
      index: 2,
      fromKey: bKey,
      toKey: navigation.currentEntry!.key,
      toId: "/c",
    });
    expect(navigation.history.map((s) => s?.id)).toEqual(["/a", "/b", "/c"]);
    expect(navigation.position).toBe(2);
    expect(listener.mock.calls.map((call) => call[0])).toEqual([
      NavigationType.Forward,
      NavigationType.Navigate,
    ]);
  });

  it("computes a traversal issued during a commit window against the applied position", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { platform } = recordingPlatform(async (transition) => {
      if (transition.type === NavigationType.Navigate) await gate;
      return true;
    });
    navigation.setPlatform(platform);

    const push = navigation.navigate(route("/c"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const back = navigation.goBack();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(navigation.position).toBe(1);
    release();

    expect(await push).toBe(true);
    expect(await back).toBe(true);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/a", "/b", "/c"]);
    expect(navigation.position).toBe(1);
    expect(navigation.state?.id).toBe("/b");
  });

  it("does not block a listener that awaits a navigation of its own", async () => {
    const navigation = createNavigation();
    const { platform, calls, transitions } = recordingPlatform();
    navigation.setPlatform(platform);
    const order: string[] = [];
    navigation.addListener(async (type, _from, to) => {
      order.push(`${type}:${to?.id}`);
      if (to?.id === "/a") {
        expect(await navigation.replace(route("/b"))).toBe(true);
      }
    });

    expect(await navigation.navigate(route("/a"))).toBe(true);
    await expect(transitions[0]!.finished).resolves.toBe(true);
    expect(order).toEqual(["navigate:/a", "replace:/b"]);
    expect(calls.map((call) => call.toId)).toEqual(["/a", "/b"]);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/b"]);
  });

  it("does not consult the platform when guards refuse", async () => {
    const navigation = createNavigation();
    navigation.router.addRoute({ id: "/private", canActivate: () => false });
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    await navigation.navigate(route("/"));
    calls.length = 0;

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(await navigation.replace(route("/private"))).toBe(false);
    expect(calls).toEqual([]);
  });

  it("propagates a platform that throws and leaves the state untouched", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    const { platform, transitions } = recordingPlatform(() => {
      throw new Error("offline");
    });
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    await expect(navigation.navigate(route("/a"))).rejects.toThrow("offline");
    expect(navigation.state?.id).toBe("/");
    expect(navigation.history).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
    await expect(transitions[0]!.finished).resolves.toBe(false);

    navigation.setPlatform(null);
    expect(await navigation.navigate(route("/a"))).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("P0: settles finished with the applied outcome only after apply and listeners", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/a"));
    await navigation.navigate(route("/b"));
    await navigation.goBack();
    const order: string[] = [];
    let veto = false;
    let gate: Promise<void> | null = null;
    const { platform, transitions } = recordingPlatform(async (transition) => {
      void transition.finished.then((applied) =>
        order.push(`finished:${transition.type}:${applied}`),
      );
      if (gate) await gate;
      return !veto;
    });
    navigation.setPlatform(platform);
    navigation.addListener(async (type) => {
      await Promise.resolve();
      order.push(`listener:${type}`);
    });

    veto = true;
    expect(await navigation.goForward()).toBe(false);
    await expect(transitions[0]!.finished).resolves.toBe(false);

    veto = false;
    let release!: () => void;
    gate = new Promise<void>((resolve) => (release = resolve));
    const forward = navigation.goForward();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(["finished:forward:false"]);
    release();
    expect(await forward).toBe(true);
    await expect(transitions[1]!.finished).resolves.toBe(true);

    gate = null;
    expect(await navigation.goBack()).toBe(true);
    await expect(transitions[2]!.finished).resolves.toBe(true);

    expect(order).toEqual([
      "finished:forward:false",
      "listener:forward",
      "finished:forward:true",
      "listener:back",
      "finished:back:true",
    ]);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/a", "/b"]);
    expect(navigation.position).toBe(0);
  });

  it("leaves the installed platform in place across setState", async () => {
    const navigation = createNavigation();
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    navigation.setState(0, [route("/")]);
    const homeKey = navigation.currentEntry!.key;

    expect(await navigation.navigate(route("/a"))).toBe(true);
    expect(calls).toEqual([
      {
        type: NavigationType.Navigate,
        index: 1,
        fromKey: homeKey,
        toKey: navigation.currentEntry!.key,
        toId: "/a",
      },
    ]);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a"]);
  });
});

describe("Navigation guard redirects", () => {
  it("lets a push guard redirect with navigate() into the guarded slot", async () => {
    const navigation = createNavigation();
    let redirect: Promise<boolean> | null = null;
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        redirect = navigation.navigate(route("/login"));
        await redirect;
        return false;
      },
    });
    await navigation.navigate(route("/"));
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(await redirect!).toBe(true);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    expect(navigation.position).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Navigate,
      route("/"),
      route("/login"),
    );
    expect(calls).toEqual([
      {
        type: NavigationType.Navigate,
        index: 1,
        fromKey: navigation.entries[0]!.key,
        toKey: navigation.entries[1]!.key,
        toId: "/login",
      },
    ]);
  });

  it("lets a push guard redirect with replace() into the guarded slot", async () => {
    const navigation = createNavigation();
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        await navigation.replace(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));
    const homeKey = navigation.currentEntry!.key;
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    expect(navigation.position).toBe(1);
    expect(navigation.entries[0]!.key).toBe(homeKey);
    expect(navigation.entries[1]!.key).not.toBe(homeKey);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Navigate,
      route("/"),
      route("/login"),
    );
  });

  it("redirects without awaiting still settle before the guarded call resolves", async () => {
    const navigation = createNavigation();
    navigation.router.addRoute({
      id: "/private",
      canActivate: () => {
        void navigation.replace(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    expect(navigation.position).toBe(1);
  });

  it("lets a replace guard redirect while keeping the slot key", async () => {
    const navigation = createNavigation();
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        await navigation.navigate(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    const aKey = navigation.currentEntry!.key;
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.replace(route("/private"))).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    expect(navigation.position).toBe(1);
    expect(navigation.currentEntry!.key).toBe(aKey);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Replace,
      route("/a"),
      route("/login"),
    );
  });

  it("lets a back traversal guard redirect into the target slot with the traversal type", async () => {
    const navigation = createNavigation();
    let locked = false;
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        if (!locked) return true;
        await navigation.replace(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/private"));
    const privateKey = navigation.currentEntry!.key;
    await navigation.navigate(route("/a"));
    const aKey = navigation.currentEntry!.key;
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    locked = true;
    expect(await navigation.goBack()).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login", "/a"]);
    expect(navigation.position).toBe(1);
    expect(navigation.currentEntry!.key).toBe(privateKey);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Back,
      route("/a"),
      route("/login"),
    );
    expect(calls).toEqual([
      {
        type: NavigationType.Back,
        index: 1,
        fromKey: aKey,
        toKey: privateKey,
        toId: "/login",
      },
    ]);
  });

  it("lets a forward traversal guard redirect into the target slot", async () => {
    const navigation = createNavigation();
    let locked = false;
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        if (!locked) return true;
        await navigation.navigate(route("/login"));
        return false;
      },
    });
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/private"));
    const privateKey = navigation.currentEntry!.key;
    await navigation.goBack();
    const listener = vi.fn();
    navigation.addListener(listener);

    locked = true;
    expect(await navigation.goForward()).toBe(false);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/login"]);
    expect(navigation.position).toBe(1);
    expect(navigation.currentEntry!.key).toBe(privateKey);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Forward,
      route("/"),
      route("/login"),
    );
  });

  it("chains redirects and resolves every superseded call to false", async () => {
    const navigation = createNavigation();
    const results: boolean[] = [];
    navigation.router.addRoute({
      id: "/private",
      canActivate: async () => {
        results.push(await navigation.replace(route("/gate")));
        return false;
      },
    });
    navigation.router.addRoute({
      id: "/gate",
      canActivate: async () => {
        results.push(await navigation.navigate(route("/a")));
        return true;
      },
    });
    await navigation.navigate(route("/"));
    const { platform, calls } = recordingPlatform();
    navigation.setPlatform(platform);
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/private"))).toBe(false);
    expect(results).toEqual([true, false]);
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a"]);
    expect(navigation.position).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Navigate,
      route("/"),
      route("/a"),
    );
    expect(calls.map((call) => call.toId)).toEqual(["/a"]);
  });

  it("lets the latest of two overlapping navigate() calls win", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    const listener = vi.fn();
    navigation.addListener(listener);

    const first = navigation.navigate(route("/a"));
    const second = navigation.navigate(route("/b"));
    expect(await Promise.all([first, second])).toEqual([false, true]);

    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/b"]);
    expect(navigation.position).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      NavigationType.Navigate,
      route("/"),
      route("/b"),
    );
  });

  it("supersedes a guarded push with go() or traverseTo() instead of redirecting", async () => {
    const navigation = createNavigation();
    await navigation.navigate(route("/"));
    const homeKey = navigation.currentEntry!.key;
    await navigation.navigate(route("/a"));
    navigation.router.addRoute({
      id: "/via-go",
      canActivate: async () => {
        await navigation.goBack();
        return true;
      },
    });
    navigation.router.addRoute({
      id: "/via-key",
      canActivate: async () => {
        await navigation.traverseTo(homeKey);
        return true;
      },
    });
    const listener = vi.fn();
    navigation.addListener(listener);

    expect(await navigation.navigate(route("/via-go"))).toBe(false);
    expect(navigation.state?.id).toBe("/");
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a"]);
    expect(listener).toHaveBeenLastCalledWith(
      NavigationType.Back,
      route("/a"),
      route("/"),
    );

    await navigation.goForward();
    expect(await navigation.navigate(route("/via-key"))).toBe(false);
    expect(navigation.state?.id).toBe("/");
    expect(navigation.history.map((s) => s?.id)).toEqual(["/", "/a"]);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      NavigationType.Back,
      route("/a"),
      route("/"),
    );
  });
});
