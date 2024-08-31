// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useAbandonedRenderDisposer } from "./useAbandonedRenderDisposer.js";
import { afterEach } from "node:test";

describe("useAbandonedRenderDisposer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it("should not call dispose in classic render", () => {
    vi.useFakeTimers();
    const fn = vi.fn();

    renderHook((props) => useAbandonedRenderDisposer(props.fn), {
      initialProps: { fn },
    });

    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
  });
  it("should call dispose in abandoned render", () => {
    vi.useFakeTimers();
    const fn = vi.fn();

    renderHook(
      (props) => {
        useAbandonedRenderDisposer(props.fn);
        throw new Promise(() => {});
      },
      {
        initialProps: { fn },
      },
    );

    vi.runAllTimers();
    expect(fn).toHaveBeenCalled();
  });
});
