// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServices } from "./useServices.js";
import type { IServiceProvider } from "@wroud/di";
import { ServiceProvider } from "./ServiceProvider.js";

describe("useServices", () => {
  it("should resolve service", () => {
    const mockedProvider: IServiceProvider = {
      getServices: vi.fn(),
    } as any;
    const service = "service";
    renderHook(({ service }) => useServices(service as any), {
      initialProps: { service },
      wrapper: ({ children }) => (
        <ServiceProvider provider={mockedProvider}>{children}</ServiceProvider>
      ),
    });

    expect(mockedProvider.getServices).toHaveBeenCalledWith(service);
  });
});
