import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RenderErrorTracker, resolveResponse } from "./render-outcome.js";

describe("RenderErrorTracker", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stays clean when the signal fires after React reported nothing", () => {
    const controller = new AbortController();
    const tracker = new RenderErrorTracker(controller.signal);
    controller.abort();
    expect(tracker.aborted).toBe(false);
    expect(tracker.errored).toBe(false);
  });

  it("reports an abort when React reports the abort reason", () => {
    const controller = new AbortController();
    const tracker = new RenderErrorTracker(controller.signal);
    controller.abort(new Error("timeout"));
    tracker.onError(controller.signal.reason);
    expect(tracker.aborted).toBe(true);
    expect(tracker.errored).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("reports and logs a render error", () => {
    const tracker = new RenderErrorTracker(new AbortController().signal);
    const error = new Error("boom");
    tracker.onError(error);
    expect(tracker.errored).toBe(true);
    expect(tracker.aborted).toBe(false);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});

describe("resolveResponse", () => {
  const app = {
    status: 404,
    headers: { "cache-control": "public, max-age=60", "x-a": "1" },
  };

  it("lets the last declared status and headers win on a clean render", () => {
    const { status, headers } = resolveResponse(new RenderErrorTracker(), app, {
      headers: { "x-a": ["2", "3"] },
    });
    expect(status).toBe(404);
    expect(headers.get("cache-control")).toBe("public, max-age=60");
    expect(headers.get("x-a")).toBe("2, 3");
  });

  it("answers 500 no-store without app headers on a render error", () => {
    const tracker = new RenderErrorTracker();
    tracker.errored = true;
    const { status, headers } = resolveResponse(tracker, app);
    expect(status).toBe(500);
    expect([...headers]).toEqual([["cache-control", "no-store"]]);
  });

  it("answers 503 no-store on an aborted render", () => {
    const controller = new AbortController();
    const tracker = new RenderErrorTracker(controller.signal);
    controller.abort();
    tracker.onError(controller.signal.reason);
    const { status, headers } = resolveResponse(tracker, app);
    expect(status).toBe(503);
    expect(headers.get("cache-control")).toBe("no-store");
  });
});
