import { describe, it, expect } from "vitest";
import { NavigationType } from "@wroud/navigation";
import { CommitGate } from "./CommitGate.js";
import { navigateTo } from "./navigateTo.js";
import { createHarness, route } from "./tests/navigation.js";

function createTarget() {
  const harness = createHarness(["/", "/a"]);
  const gate = new CommitGate(harness.navigation);
  const go = (
    to: Parameters<typeof route>[1] & { id: string },
    replace?: boolean,
  ) => navigateTo(harness.navigation, gate, route(to.id, to), replace);
  return { ...harness, gate, go };
}

describe("navigateTo", () => {
  it("keeps the current unknownQuery on a same-document target and replaces on the same URL", async () => {
    const { navigation, transition, url, go } = createTarget();
    await navigation.navigate(route("/", { unknownQuery: "gclid=x" }));

    await expect(go({ id: "/", hash: "#pricing" })).resolves.toBe(true);
    expect(transition(1).type).toBe(NavigationType.Navigate);
    expect(navigation.state).toEqual({
      id: "/",
      params: {},
      hash: "#pricing",
      unknownQuery: "gclid=x",
    });
    expect(url(navigation.state)).toBe("/?gclid=x#pricing");
    expect(navigation.entries).toHaveLength(2);

    await expect(go({ id: "/", hash: "#pricing" })).resolves.toBe(true);
    expect(transition(2).type).toBe(NavigationType.Replace);
    expect(navigation.entries).toHaveLength(2);
    expect(url(navigation.state)).toBe("/?gclid=x#pricing");

    await expect(go({ id: "/", hash: "#faq" })).resolves.toBe(true);
    expect(transition(3).type).toBe(NavigationType.Navigate);
    expect(navigation.entries).toHaveLength(3);
    expect(url(navigation.state)).toBe("/?gclid=x#faq");
  });

  it("drops a stale unknownQuery from a same-document target", async () => {
    const { navigation, url, go } = createTarget();
    await navigation.navigate(route("/"));
    await go({ id: "/", hash: "#x", unknownQuery: "old=1" });
    expect(url(navigation.state)).toBe("/#x");
  });

  it("leaves other documents untouched and honours replace", async () => {
    const { navigation, transition, go } = createTarget();
    await navigation.navigate(route("/", { unknownQuery: "gclid=x" }));

    await go({ id: "/a" });
    expect(transition(1).type).toBe(NavigationType.Navigate);
    expect(navigation.state).toEqual({ id: "/a", params: {} });

    await go({ id: "/", hash: "#pricing" }, true);
    expect(transition(2).type).toBe(NavigationType.Replace);
    expect(navigation.state).toEqual({ id: "/", params: {}, hash: "#pricing" });
    expect(navigation.entries).toHaveLength(2);
  });
});
