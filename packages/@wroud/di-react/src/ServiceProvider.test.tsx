// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ServiceProvider } from "./ServiceProvider.js";
import "./tests/testingLibrary.js";
import { useContext } from "react";
import { ServiceProviderContext } from "./ServiceProviderContext.js";
import type { IServiceProvider } from "@wroud/di";

describe("ServiceProvider", () => {
  it("should provide context", () => {
    const testValue = "test";
    const fn = vi.fn();
    function TestComp() {
      const provider = useContext(ServiceProviderContext);
      fn(provider);
      return null;
    }

    render(
      <ServiceProvider provider={testValue as unknown as IServiceProvider}>
        <TestComp />
      </ServiceProvider>,
    );

    expect(fn).toHaveBeenCalledWith(testValue);
  });
  it("should update context", () => {
    const testValue = "test";
    const fn = vi.fn();
    function TestComp() {
      const provider = useContext(ServiceProviderContext);
      fn(provider);
      return null;
    }

    const { rerender } = render(
      <ServiceProvider provider={null as unknown as IServiceProvider}>
        <TestComp />
      </ServiceProvider>,
    );

    expect(fn).toHaveBeenCalledWith(null);

    rerender(
      <ServiceProvider provider={testValue as unknown as IServiceProvider}>
        <TestComp />
      </ServiceProvider>,
    );

    expect(fn).toHaveBeenCalledWith(testValue);
  });
});
