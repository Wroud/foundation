import { describe, it, expect, vi } from "vitest";
import {
  createFlightNavigation,
  type FlightPromise,
} from "./flight-navigation.js";
import type { RscPayload } from "./shared.js";

const BASE = "https://app.test/";

function makePayload(id: string): RscPayload {
  return { root: id, context: {} };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeNav(
  fetchFlight: (url: URL) => FlightPromise,
  overrides: Partial<Parameters<typeof createFlightNavigation>[0]> = {},
) {
  const update = vi.fn<(payload: RscPayload) => void>();
  const nav = createFlightNavigation({
    fetchFlight,
    update,
    resolveBase: () => BASE,
    ...overrides,
  });
  return { ...nav, update };
}

describe("createFlightNavigation", () => {
  it("navigate fetches and renders when nothing is prefetched", async () => {
    const payload = makePayload("about");
    const fetchFlight = vi.fn(async () => payload);
    const { navigate, update } = makeNav(fetchFlight);

    await navigate("/about");

    expect(fetchFlight).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(payload);
  });

  it("navigate reuses a prefetched flight without a second fetch", async () => {
    const payload = makePayload("about");
    const fetchFlight = vi.fn(async () => payload);
    const { navigate, prefetch, update } = makeNav(fetchFlight);

    await prefetch("/about");
    expect(update).not.toHaveBeenCalled();

    await navigate("/about");

    expect(fetchFlight).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(payload);
  });

  it("dedupes concurrent prefetch calls for the same href", async () => {
    const d = deferred<RscPayload>();
    const fetchFlight = vi.fn(() => d.promise);
    const { prefetch } = makeNav(fetchFlight);

    const a = prefetch("/about");
    const b = prefetch("/about");
    expect(fetchFlight).toHaveBeenCalledTimes(1);

    d.resolve(makePayload("about"));
    await Promise.all([a, b]);

    expect(fetchFlight).toHaveBeenCalledTimes(1);
  });

  it("navigate reuses an in-flight prefetch instead of duplicating it", async () => {
    const d = deferred<RscPayload>();
    const fetchFlight = vi.fn(() => d.promise);
    const { navigate, prefetch, update } = makeNav(fetchFlight);

    const warming = prefetch("/about");
    const navigation = navigate("/about");
    expect(fetchFlight).toHaveBeenCalledTimes(1);

    const payload = makePayload("about");
    d.resolve(payload);
    await Promise.all([warming, navigation]);

    expect(fetchFlight).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(payload);
  });

  it("normalizes hrefs so a differing hash reuses the same flight", async () => {
    const payload = makePayload("about");
    const fetchFlight = vi.fn(async () => payload);
    const { navigate, prefetch } = makeNav(fetchFlight);

    await prefetch("/about#intro");
    await navigate("/about#details");

    expect(fetchFlight).toHaveBeenCalledTimes(1);
  });

  it("self-heals after a failed prefetch: the entry is evicted and navigate refetches", async () => {
    const good = makePayload("about");
    const fetchFlight = vi
      .fn<(url: URL) => FlightPromise>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(good);
    const { navigate, prefetch, update } = makeNav(fetchFlight);

    await expect(prefetch("/about")).resolves.toBeUndefined();
    expect(update).not.toHaveBeenCalled();

    await navigate("/about");

    expect(fetchFlight).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(good);
  });

  it("keeps the last-write-wins race guard: rapid navigations render only the latest", async () => {
    const dA = deferred<RscPayload>();
    const dB = deferred<RscPayload>();
    const dC = deferred<RscPayload>();
    const fetchFlight = vi
      .fn<(url: URL) => FlightPromise>()
      .mockReturnValueOnce(dA.promise)
      .mockReturnValueOnce(dB.promise)
      .mockReturnValueOnce(dC.promise);
    const { navigate, update } = makeNav(fetchFlight);

    const a = navigate("/a");
    const b = navigate("/b");
    const c = navigate("/c");

    const pa = makePayload("a");
    const pb = makePayload("b");
    const pc = makePayload("c");
    dC.resolve(pc);
    dA.resolve(pa);
    dB.resolve(pb);
    await Promise.all([a, b, c]);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(pc);
  });

  it("expires cached flights after the ttl", async () => {
    let clock = 1000;
    const payload = makePayload("about");
    const fetchFlight = vi.fn(async () => payload);
    const { navigate, prefetch } = makeNav(fetchFlight, {
      ttl: 100,
      now: () => clock,
    });

    await prefetch("/about");
    clock += 500;
    await navigate("/about");

    expect(fetchFlight).toHaveBeenCalledTimes(2);
  });

  it("bounds the cache and evicts the oldest entry", async () => {
    const fetchFlight = vi.fn(async (url: URL) => makePayload(url.pathname));
    const { navigate, prefetch } = makeNav(fetchFlight, { maxEntries: 2 });

    await prefetch("/a");
    await prefetch("/b");
    await prefetch("/c");
    expect(fetchFlight).toHaveBeenCalledTimes(3);

    await navigate("/a");
    expect(fetchFlight).toHaveBeenCalledTimes(4);

    await navigate("/b");
    expect(fetchFlight).toHaveBeenCalledTimes(4);
  });

  it("a stale failed prefetch does not evict a newer entry re-stored for the same href", async () => {
    const stale = deferred<RscPayload>();
    const reused = makePayload("about-fresh");
    const fetchFlight = vi
      .fn<(url: URL) => FlightPromise>()
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(reused)
      .mockResolvedValue(makePayload("about-unexpected"));
    const { navigate, prefetch, update } = makeNav(fetchFlight);

    prefetch("/about");
    const firstNav = navigate("/about");
    await prefetch("/about");

    stale.reject(new Error("stale"));
    await firstNav.catch(() => {});

    await navigate("/about");

    expect(fetchFlight).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(reused);
  });
});
