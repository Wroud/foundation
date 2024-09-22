// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServiceSync } from "./useServiceSync.js";
import type { IServiceProvider } from "@wroud/di";
import { ServiceProvider } from "./ServiceProvider.js";

describe("useServiceSync", () => {
  it("should resolve service", () => {
    const mockedProvider: IServiceProvider = {
      getService: vi.fn(),
    } as any;
    const service = "service";
    renderHook(({ service }) => useServiceSync(service as any), {
      initialProps: { service },
      wrapper: ({ children }) => (
        <ServiceProvider provider={mockedProvider}>{children}</ServiceProvider>
      ),
    });

    expect(mockedProvider.getService).toHaveBeenCalledWith(service);
  });
});
