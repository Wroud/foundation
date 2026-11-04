// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAppConfig } from "../../app/AppInstance.js";
import type { IndexComponentContext } from "../IndexComponent.js";
import type { ClientModuleLoaderHost } from "./client-module-loads.js";
import type { RscPayload } from "./shared.js";

const flight = vi.hoisted(() => ({
  createFromReadableStream: vi.fn(),
  createFromFetch: vi.fn(),
}));
const dom = vi.hoisted(() => ({
  hydrateRoot: vi.fn(),
  createRoot: vi.fn(),
}));

vi.mock("@vitejs/plugin-rsc/browser", () => ({
  createFromReadableStream: flight.createFromReadableStream,
  createFromFetch: flight.createFromFetch,
  setServerCallback: () => {},
  createTemporaryReferenceSet: () => ({}),
  encodeReply: async () => "",
}));
vi.mock("rsc-html-stream/client", () => ({ rscStream: {} }));
vi.mock("react-dom/client", () => ({
  hydrateRoot: dom.hydrateRoot,
  createRoot: dom.createRoot,
}));

import { hydrate } from "./browser.js";

const host = globalThis as ClientModuleLoaderHost;
const payload: RscPayload = { root: null, context: {}, mount: "" };

function installLoader(loads: Record<string, Promise<unknown>>) {
  const loader = (id: string) => loads[id];
  host.__vite_rsc_client_require__ = loader;
  return loader;
}

function parsePayloadLoading(...ids: string[]) {
  flight.createFromReadableStream.mockImplementation(async () => {
    for (const id of ids) {
      host.__vite_rsc_client_require__!(id);
    }
    return payload;
  });
}

function listen(prevent: boolean) {
  const seen: unknown[] = [];
  const listener = (event: Event) => {
    seen.push((event as Event & { payload: unknown }).payload);
    if (prevent) {
      event.preventDefault();
    }
  };
  window.addEventListener("vite:preloadError", listener);
  return {
    seen,
    remove: () => window.removeEventListener("vite:preloadError", listener),
  };
}

const noEntry = { "": () => undefined };

describe("hydrate", () => {
  let cleanup: Array<() => void> = [];

  beforeEach(() => {
    flight.createFromReadableStream.mockReset();
    flight.createFromFetch.mockReset();
    dom.hydrateRoot.mockReset();
    dom.hydrateRoot.mockReturnValue({ render: vi.fn(), unmount: vi.fn() });
  });

  afterEach(() => {
    for (const fn of cleanup) {
      fn();
    }
    cleanup = [];
    delete host.__vite_rsc_client_require__;
  });

  it("hydrates once every started module load has finished", async () => {
    const loader = installLoader({ a: Promise.resolve({}) });
    parsePayloadLoading("a");
    await hydrate(noEntry);
    expect(dom.hydrateRoot).toHaveBeenCalledWith(
      document,
      expect.anything(),
      expect.anything(),
    );
    expect(host.__vite_rsc_client_require__).toBe(loader);
  });

  it("keeps the document, dispatches vite:preloadError and throws the import error", async () => {
    const error = new TypeError("Failed to fetch dynamically imported module");
    const loader = installLoader({
      a: Promise.reject(error),
      b: Promise.resolve({}),
    });
    parsePayloadLoading("a", "b");
    const events = listen(false);
    cleanup.push(events.remove);
    await expect(hydrate(noEntry)).rejects.toBe(error);
    expect(events.seen).toEqual([error]);
    expect(dom.hydrateRoot).not.toHaveBeenCalled();
    expect(host.__vite_rsc_client_require__).toBe(loader);
  });

  it("returns quietly when the event is prevented and falls back to full navigation", async () => {
    installLoader({ a: Promise.reject(new TypeError("blocked")) });
    parsePayloadLoading("a");
    const events = listen(true);
    cleanup.push(events.remove);
    let context: IndexComponentContext | undefined;
    const entry = createAppConfig(() => null, {
      onAppStart: (started) => {
        context = started;
        return { base: "/" };
      },
    });
    await hydrate({ "": () => ({ default: entry }) });
    expect(dom.hydrateRoot).not.toHaveBeenCalled();

    flight.createFromFetch.mockResolvedValue(payload);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response());
    cleanup.push(() => fetchSpy.mockRestore());
    const assign = vi
      .spyOn(window.location, "assign")
      .mockImplementation(() => {});
    cleanup.push(() => assign.mockRestore());
    await context!.navigate!("/about");
    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/\/about$/));
  });

  it("routes a failed app entry import through the same gate", async () => {
    const error = new TypeError("entry chunk missing");
    installLoader({});
    parsePayloadLoading();
    const events = listen(false);
    cleanup.push(events.remove);
    await expect(hydrate({ "": () => Promise.reject(error) })).rejects.toBe(
      error,
    );
    expect(events.seen).toEqual([error]);
    expect(dom.hydrateRoot).not.toHaveBeenCalled();
  });

  it("restores the module loader when app start throws", async () => {
    const loader = installLoader({});
    parsePayloadLoading();
    const entry = createAppConfig(() => null, {
      onAppStart: () => {
        throw new Error("start failed");
      },
    });
    await expect(hydrate({ "": () => ({ default: entry }) })).rejects.toThrow(
      "start failed",
    );
    expect(host.__vite_rsc_client_require__).toBe(loader);
  });
});
