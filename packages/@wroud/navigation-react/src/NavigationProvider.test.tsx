import { describe, it, expect, vi } from "vitest";
import { Suspense, act, use } from "react";
import { NavigationType } from "@wroud/navigation";
import { Link } from "./Link.js";
import { NavigationProvider } from "./NavigationProvider.js";
import { RouteCommitted } from "./RouteCommitted.js";
import { useNavigation } from "./useNavigation.js";
import { useNavigationState } from "./useNavigationState.js";
import type { LoadRoute } from "./LoadRoute.js";
import { createHarness, deferred, route, settle } from "./tests/navigation.js";
import { mount } from "./tests/react.js";

function Page({ block }: { block: Map<string, Promise<void>> }) {
  const state = useNavigationState();
  const blocker = state ? block.get(state.id) : undefined;
  if (blocker) use(blocker);
  return (
    <>
      <output>{state?.id ?? "none"}</output>
      <RouteCommitted state={state} />
    </>
  );
}

function Plain() {
  const state = useNavigationState();
  return <output>{state?.id ?? "none"}</output>;
}

describe("NavigationProvider", () => {
  it("keeps the link pending and finished unsettled until the suspended route commits", async () => {
    const { navigation, transitions, finished } = createHarness();
    await navigation.navigate(route("/"));
    const loading = deferred();
    const page = deferred();
    const block = new Map([["/a", page.promise]]);
    const load: LoadRoute = () => loading.promise;

    const view = mount();
    await act(async () => {
      view.root.render(
        <NavigationProvider navigation={navigation} load={load}>
          <Link to={route("/a")}>go</Link>
          <Suspense fallback={<output>loading</output>}>
            <Page block={block} />
          </Suspense>
        </NavigationProvider>,
      );
    });
    expect(view.text()).toBe("/");
    const anchor = view.query("a");
    expect(anchor.getAttribute("href")).toBe("/a");

    await act(async () => {
      (anchor as HTMLAnchorElement).click();
      await settle();
    });
    expect(transitions).toHaveLength(2);
    expect(navigation.state?.id).toBe("/a");
    expect(anchor.getAttribute("data-status")).toBe("pending");
    expect(view.text()).toBe("/");
    expect(await finished(1)).toBeNull();

    loading.resolve();
    await act(async () => {
      await settle();
    });
    expect(anchor.getAttribute("data-status")).toBe("pending");
    expect(view.text()).toBe("/");
    expect(await finished(1)).toBeNull();

    page.resolve();
    await act(async () => {
      await settle();
    });
    expect(view.text()).toBe("/a");
    expect(await finished(1)).toBe(true);
    await act(async () => {
      await settle();
    });
    expect(anchor.getAttribute("data-status")).toBeNull();

    await view.unmount();
  });

  it.each<[string, LoadRoute]>([
    [
      "rejects",
      async () => {
        throw new Error("boom");
      },
    ],
    [
      "throws synchronously",
      () => {
        throw new Error("boom");
      },
    ],
  ])(
    "applies the entry and settles finished when load %s",
    async (_name, load) => {
      const { navigation, finished } = createHarness();
      await navigation.navigate(route("/"));

      const view = mount();
      await act(async () => {
        view.root.render(
          <NavigationProvider navigation={navigation} load={load}>
            <RouteCommitted state={route("/")} />
            <Plain />
          </NavigationProvider>,
        );
      });
      expect(view.text()).toBe("/");

      const done = navigation.navigate(route("/a"));
      await act(async () => {
        await settle();
      });
      expect(view.text()).toBe("/a");
      expect(await finished(1)).toBe(true);
      await expect(done).resolves.toBe(true);

      await view.unmount();
    },
  );

  it("skips load for a target whose marker is mounted", async () => {
    const { navigation } = createHarness();
    await navigation.navigate(route("/"));
    const load = vi.fn<LoadRoute>(async () => {});

    const view = mount();
    await act(async () => {
      view.root.render(
        <NavigationProvider navigation={navigation} load={load}>
          <RouteCommitted state={route("/")} />
          <Plain />
        </NavigationProvider>,
      );
      await settle();
    });
    expect(load).not.toHaveBeenCalled();

    await act(async () => {
      void navigation.navigate(route("/", { hash: "#x" }));
      await settle();
    });
    expect(navigation.state?.hash).toBe("#x");
    expect(load).not.toHaveBeenCalled();

    await act(async () => {
      void navigation.navigate(route("/a"));
      await settle();
    });
    expect(view.text()).toBe("/a");
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(
      route("/a"),
      route("/", { hash: "#x" }),
      NavigationType.Navigate,
    );

    await view.unmount();
  });

  it("loads the current entry at mount when no marker for it is mounted", async () => {
    const { navigation } = createHarness();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    const load = vi.fn<LoadRoute>(async () => {});

    const view = mount();
    await act(async () => {
      view.root.render(
        <NavigationProvider navigation={navigation} load={load}>
          <RouteCommitted state={route("/")} />
          <Plain />
        </NavigationProvider>,
      );
      await settle();
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(
      route("/a"),
      null,
      NavigationType.Navigate,
    );
    expect(view.text()).toBe("/a");

    await view.unmount();
  });

  it("only resyncs at mount when the current entry's marker is mounted", async () => {
    const { navigation } = createHarness();
    await navigation.navigate(route("/"));
    await navigation.navigate(route("/a"));
    const load = vi.fn<LoadRoute>(async () => {});

    const view = mount();
    await act(async () => {
      view.root.render(
        <NavigationProvider navigation={navigation} load={load}>
          <RouteCommitted state={route("/a", { hash: "#x" })} />
          <Plain />
        </NavigationProvider>,
      );
      await settle();
    });
    expect(load).not.toHaveBeenCalled();
    expect(view.text()).toBe("/a");

    await view.unmount();
  });

  it("does not re-render stable context consumers on navigation", async () => {
    const { navigation } = createHarness();
    await navigation.navigate(route("/"));
    let renders = 0;
    function Stable() {
      useNavigation();
      renders++;
      return null;
    }

    const view = mount();
    await act(async () => {
      view.root.render(
        <NavigationProvider navigation={navigation}>
          <Stable />
          <Page block={new Map()} />
        </NavigationProvider>,
      );
    });
    expect(renders).toBe(1);

    await act(async () => {
      void navigation.navigate(route("/a"));
      await settle();
    });
    expect(view.text()).toBe("/a");
    expect(renders).toBe(1);

    await view.unmount();
  });
});
