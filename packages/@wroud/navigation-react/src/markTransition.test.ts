import { describe, it, expect, vi, afterEach } from "vitest";
import { NavigationType } from "@wroud/navigation";

type ReactModule = Record<string, unknown>;

async function load(extra: ReactModule) {
  vi.resetModules();
  vi.doMock("react", async (importOriginal) => ({
    ...(await importOriginal<ReactModule>()),
    addTransitionType: undefined,
    unstable_addTransitionType: undefined,
    ...extra,
  }));
  return (await import("./markTransition.js")).markTransition;
}

describe("markTransition", () => {
  afterEach(() => {
    vi.doUnmock("react");
    vi.resetModules();
  });

  it("calls the experimental unstable_addTransitionType", async () => {
    const unstable = vi.fn();
    const markTransition = await load({ unstable_addTransitionType: unstable });
    markTransition(NavigationType.Back);
    expect(unstable).toHaveBeenCalledWith("navigation-back");
  });

  it("prefers the stable addTransitionType", async () => {
    const stable = vi.fn();
    const unstable = vi.fn();
    const markTransition = await load({
      addTransitionType: stable,
      unstable_addTransitionType: unstable,
    });
    markTransition(NavigationType.Navigate);
    expect(stable).toHaveBeenCalledWith("navigation-navigate");
    expect(unstable).not.toHaveBeenCalled();
  });

  it("is a no-op when React exports neither", async () => {
    const markTransition = await load({});
    expect(() => markTransition(NavigationType.Replace)).not.toThrow();
  });
});
