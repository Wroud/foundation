// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServicesSync } from "./useServicesSync.js";
import type { IServiceProvider } from "@wroud/di";
import { ServiceProvider } from "./ServiceProvider.js";

describe("useServicesSync", () => {
  it("should resolve service", () => {
    const mockedProvider: IServiceProvider = {
      getServices: vi.fn(),
    } as any;
    const service = "service";
    renderHook(({ service }) => useServicesSync(service as any), {
      initialProps: { service },
      wrapper: ({ children }) => (
        <ServiceProvider provider={mockedProvider}>{children}</ServiceProvider>
      ),
    });

    expect(mockedProvider.getServices).toHaveBeenCalledWith(service);
  });
});
