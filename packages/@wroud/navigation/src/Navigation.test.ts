import { describe, it, expect, vi, afterEach } from "vitest";
import { Navigation } from "./Navigation.js";

function createNavigation() {
  const navigation = new Navigation();
  navigation.router.addRoute({ id: "/" });
  navigation.router.addRoute({ id: "/a" });
  navigation.router.addRoute({ id: "/b" });
  return navigation;
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

    await expect(
      navigation.navigate({ id: "/a", params: {} }),
    ).resolves.toBeUndefined();

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

    await navigation.navigate({ id: "/a", params: {} });
    await navigation.replace({ id: "/b", params: {} });
    await navigation.navigate({ id: "/a", params: {} });
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
