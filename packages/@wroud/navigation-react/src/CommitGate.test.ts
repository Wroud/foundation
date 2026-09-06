import { describe, it, expect } from "vitest";
import { CommitGate } from "./CommitGate.js";
import { createHarness, route, settle } from "./tests/navigation.js";

function createGate() {
  const harness = createHarness(["/", "/a", "/b", "/docs/:page?tab=:tab"]);
  const gate = new CommitGate(harness.navigation);
  harness.navigation.addListener((_type, _from, to) => gate.wait(to));
  return { ...harness, gate };
}

describe("CommitGate", () => {
  it("holds finished until the target token mounts", async () => {
    const { navigation, gate, finished } = createGate();
    const done = navigation.navigate(route("/a"));
    await settle();
    expect(navigation.state?.id).toBe("/a");
    expect(await finished(0)).toBeNull();

    gate.mount(gate.tokenOf(route("/a")));
    await settle();
    expect(await finished(0)).toBe(true);
    await expect(done).resolves.toBe(true);
  });

  it("settles at once when the token is already mounted", async () => {
    const { navigation, gate, finished } = createGate();
    gate.mount(gate.tokenOf(route("/a")));
    const done = navigation.navigate(route("/a"));
    await settle();
    expect(await finished(0)).toBe(true);
    await expect(done).resolves.toBe(true);
  });

  it("settles a hash-only navigation at once", async () => {
    const { navigation, gate, finished, url } = createGate();
    gate.mount(gate.tokenOf(route("/")));
    await navigation.navigate(route("/"));

    const target = route("/", { hash: "#x" });
    expect(url(target)).toBe("/#x");
    expect(gate.tokenOf(target)).toBe(gate.tokenOf(route("/")));

    const done = navigation.navigate(target);
    await settle();
    expect(navigation.state?.hash).toBe("#x");
    expect(await finished(1)).toBe(true);
    await expect(done).resolves.toBe(true);
  });

  it("settles a navigation to a null state at once", async () => {
    const { navigation, gate, finished } = createGate();
    await navigation.navigate(route("/"));
    const done = navigation.navigate(null);
    await settle();
    expect(navigation.state).toBeNull();
    expect(gate.tokenOf(null)).toBe("");
    expect(gate.isMounted("")).toBe(false);
    expect(await finished(1)).toBe(true);
    await expect(done).resolves.toBe(true);
  });

  it("lets a newer navigation settle the older waiter", async () => {
    const { navigation, gate, finished } = createGate();
    const first = navigation.navigate(route("/a"));
    await settle();
    expect(await finished(0)).toBeNull();

    const second = navigation.navigate(route("/b"));
    await settle();
    expect(await finished(0)).toBe(true);
    expect(await finished(1)).toBeNull();

    gate.mount(gate.tokenOf(route("/b")));
    await settle();
    expect(await finished(1)).toBe(true);
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
  });

  it("keeps a token mounted until every marker unmounted", async () => {
    const { navigation, gate, finished } = createGate();
    const token = gate.tokenOf(route("/a"));
    gate.mount(token);
    gate.mount(token);
    gate.unmount(token);
    expect(gate.isMounted(token)).toBe(true);

    const first = navigation.navigate(route("/a"));
    await settle();
    expect(await finished(0)).toBe(true);
    await expect(first).resolves.toBe(true);

    gate.unmount(token);
    expect(gate.isMounted(token)).toBe(false);
    const second = navigation.replace(route("/a"));
    await settle();
    expect(await finished(1)).toBeNull();

    gate.mount(token);
    await settle();
    expect(await finished(1)).toBe(true);
    await expect(second).resolves.toBe(true);
  });

  it("settles the waiter on release", async () => {
    const { navigation, gate, finished } = createGate();
    const done = navigation.navigate(route("/a"));
    await settle();
    expect(await finished(0)).toBeNull();

    gate.release();
    await settle();
    expect(await finished(0)).toBe(true);
    await expect(done).resolves.toBe(true);
  });

  it("ignores hash and unknownQuery in the token", () => {
    const { gate, url } = createGate();
    const tracked = route("/", { unknownQuery: "gclid=x&utm_source=y" });
    expect(url(tracked)).toBe("/?gclid=x&utm_source=y");
    expect(gate.tokenOf(tracked)).toBe(gate.tokenOf(route("/")));
    expect(gate.tokenOf({ ...tracked, hash: "#pricing" })).toBe(
      gate.tokenOf(route("/")),
    );
  });

  it("derives the same token from a state and its URL round trip", () => {
    const { gate, matcher, url } = createGate();
    const withTab = route("/docs/:page?tab=:tab", {
      params: { page: "intro", tab: "api" },
    });
    const withoutTab = route("/docs/:page?tab=:tab", {
      params: { page: "intro" },
    });

    expect(url(withTab)).toBe("/docs/intro?tab=api");
    expect(url(withoutTab)).toBe("/docs/intro");
    expect(gate.tokenOf(matcher.urlToState(url(withTab)))).toBe(
      gate.tokenOf(withTab),
    );
    expect(gate.tokenOf(matcher.urlToState(url(withoutTab)))).toBe(
      gate.tokenOf(withoutTab),
    );
    expect(
      gate.tokenOf(matcher.urlToState("/docs/intro?tab=api&gclid=x#h")),
    ).toBe(gate.tokenOf(withTab));
    expect(gate.tokenOf(withTab)).not.toBe(gate.tokenOf(withoutTab));
  });
});
