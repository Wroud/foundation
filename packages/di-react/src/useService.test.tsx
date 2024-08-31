// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useService } from "./useService.js";
import type { IServiceProvider } from "@wroud/di";
import { ServiceProvider } from "./ServiceProvider.js";

describe("useService", () => {
  it("should resolve service", () => {
    const mockedProvider: IServiceProvider = {
      getService: vi.fn(),
    } as any;
    const service = "service";
    renderHook(({ service }) => useService(service as any), {
      initialProps: { service },
      wrapper: ({ children }) => (
        <ServiceProvider provider={mockedProvider}>{children}</ServiceProvider>
      ),
    });

    expect(mockedProvider.getService).toHaveBeenCalledWith(service);
  });
});
