import { describe, it, expect, vi } from "vitest";
import {
  trackClientModuleLoads,
  type ClientModuleLoaderHost,
} from "./client-module-loads.js";

import { deferred, type Deferred } from "../../tests/deferred.js";

function makeHost(loads: Record<string, Deferred<void>>) {
  const cache = new Map<string, Promise<void>>();
  const load = vi.fn((id: string) => {
    let promise = cache.get(id);
    if (!promise) {
      promise = loads[id]!.promise;
      cache.set(id, promise);
    }
    return promise;
  });
  const host: ClientModuleLoaderHost = { __vite_rsc_client_require__: load };
  return { host, load };
}

async function settledState(promise: Promise<unknown>) {
  const marker = Symbol("pending");
  const winner = await Promise.race([promise, Promise.resolve(marker)]);
  return winner === marker ? "pending" : "settled";
}

describe("trackClientModuleLoads", () => {
  it("throws when the loader is not installed", () => {
    expect(() => trackClientModuleLoads({})).toThrow(/not initialized/);
  });

  it("returns the loader's promise unchanged", () => {
    const a = deferred<void>();
    const { host, load } = makeHost({ a });
    trackClientModuleLoads(host);
    expect(host.__vite_rsc_client_require__!("a")).toBe(a.promise);
    expect(host.__vite_rsc_client_require__!("a")).toBe(a.promise);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("settles once every started load has finished", async () => {
    const a = deferred<void>();
    const b = deferred<void>();
    const { host } = makeHost({ a, b });
    const loads = trackClientModuleLoads(host);
    host.__vite_rsc_client_require__!("a");
    host.__vite_rsc_client_require__!("b");
    const settle = loads.settle();
    a.resolve();
    await Promise.resolve();
    expect(await settledState(settle)).toBe("pending");
    b.resolve();
    expect(await settle).toEqual([]);
  });

  it("resolves immediately when nothing was loaded", async () => {
    const { host } = makeHost({});
    expect(await trackClientModuleLoads(host).settle()).toEqual([]);
  });

  it("reports a failed load once without rejecting", async () => {
    const a = deferred<void>();
    const b = deferred<void>();
    const { host } = makeHost({ a, b });
    const loads = trackClientModuleLoads(host);
    host.__vite_rsc_client_require__!("a");
    host.__vite_rsc_client_require__!("a");
    host.__vite_rsc_client_require__!("b");
    const error = new TypeError("Failed to fetch dynamically imported module");
    a.reject(error);
    b.resolve();
    expect(await loads.settle()).toEqual([error]);
  });

  it("keeps waiting for loads started while settling", async () => {
    const a = deferred<void>();
    const b = deferred<void>();
    const { host } = makeHost({ a, b });
    const loads = trackClientModuleLoads(host);
    host.__vite_rsc_client_require__!("a");
    const settle = loads.settle();
    a.resolve();
    await Promise.resolve();
    host.__vite_rsc_client_require__!("b");
    await Promise.resolve();
    expect(await settledState(settle)).toBe("pending");
    b.reject("late");
    expect(await settle).toEqual(["late"]);
  });

  it("restores the original loader once settled", async () => {
    const a = deferred<void>();
    const { host, load } = makeHost({ a });
    const loads = trackClientModuleLoads(host);
    expect(host.__vite_rsc_client_require__).not.toBe(load);
    host.__vite_rsc_client_require__!("a");
    a.resolve();
    await loads.settle();
    expect(host.__vite_rsc_client_require__).toBe(load);
  });

  it("passes non-promise results through untracked", async () => {
    const host: ClientModuleLoaderHost = {
      __vite_rsc_client_require__: () => ({ default: 1 }),
    };
    const loads = trackClientModuleLoads(host);
    expect(host.__vite_rsc_client_require__!("x")).toEqual({ default: 1 });
    expect(await loads.settle()).toEqual([]);
  });
});

describe("trackClientModuleLoads dispose", () => {
  it("restores the loader once and leaves a later replacement alone", () => {
    const { host, load } = makeHost({});
    const loads = trackClientModuleLoads(host);
    loads.dispose();
    expect(host.__vite_rsc_client_require__).toBe(load);
    const replacement = () => undefined;
    host.__vite_rsc_client_require__ = replacement;
    loads.dispose();
    expect(host.__vite_rsc_client_require__).toBe(replacement);
  });
});
