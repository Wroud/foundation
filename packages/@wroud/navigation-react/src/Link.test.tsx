// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import type { IRouteState } from "@wroud/navigation";
import { Link } from "./Link.js";
import { NavigationProvider } from "./NavigationProvider.js";
import { RouteCommitted } from "./RouteCommitted.js";
import { createHarness, route, settle } from "./tests/navigation.js";
import { clickWith, mount } from "./tests/react.js";

async function render(prefetch: (state: IRouteState) => void) {
  const harness = createHarness();
  await harness.navigation.navigate(route("/"));
  const view = mount();
  await act(async () => {
    view.root.render(
      <NavigationProvider navigation={harness.navigation} prefetch={prefetch}>
        <RouteCommitted state={route("/")} />
        <Link id="self" to={route("/a")}>
          self
        </Link>
        <Link id="same" to={route("/", { hash: "#x" })}>
          same
        </Link>
        <Link id="blank" to={route("/a")} target="_blank">
          blank
        </Link>
        <Link id="stopped" to={route("/a")} onClick={(e) => e.preventDefault()}>
          stopped
        </Link>
      </NavigationProvider>,
    );
  });
  return { ...harness, view };
}

describe("Link", () => {
  it("prefetches on pointerenter and focus only for intercepted links to documents not on screen", async () => {
    const prefetch = vi.fn();
    const { view } = await render(prefetch);
    for (const id of ["#self", "#blank", "#same"]) {
      const anchor = view.query(id);
      await act(async () => {
        anchor.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
        anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
    }
    expect(prefetch).toHaveBeenCalledTimes(2);
    expect(prefetch).toHaveBeenNthCalledWith(1, route("/a"));
    expect(prefetch).toHaveBeenNthCalledWith(2, route("/a"));
    await view.unmount();
  });

  it("intercepts only plain primary clicks on same-window links", async () => {
    const { view, transitions } = await render(() => {});
    const self = view.query("#self");
    let intercepted = false;

    await act(async () => {
      intercepted = clickWith(self, { ctrlKey: true });
      await settle();
    });
    expect(intercepted).toBe(false);
    await act(async () => {
      intercepted = clickWith(self, { button: 1 });
      await settle();
    });
    expect(intercepted).toBe(false);
    await act(async () => {
      intercepted = clickWith(view.query("#blank"));
      await settle();
    });
    expect(intercepted).toBe(false);
    await act(async () => {
      clickWith(view.query("#stopped"));
      await settle();
    });
    expect(transitions).toHaveLength(1);

    await act(async () => {
      intercepted = clickWith(self);
      await settle();
    });
    expect(intercepted).toBe(true);
    expect(transitions).toHaveLength(2);
    expect(transitions[1]?.to.state).toEqual(route("/a"));

    await view.unmount();
  });
});