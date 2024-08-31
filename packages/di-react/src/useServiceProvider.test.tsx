// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServiceProvider } from "./useServiceProvider.js";
import { ServiceProvider } from "./ServiceProvider.js";

describe("useServiceProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should throw error without context", () => {
    const consoleError = vi.spyOn(console, "error");
    consoleError.mockImplementation(() => {});

    expect(() => renderHook(() => useServiceProvider())).toThrowError(
      "No service provider found in the context.",
    );
  });
  it("should return provider", () => {
    const testValue = "test";
    const { result } = renderHook(() => useServiceProvider(), {
      wrapper: ({ children }) => (
        <ServiceProvider provider={testValue as any}>
          {children}
        </ServiceProvider>
      ),
    });

    expect(result.current).toBe(testValue);
  });
});
