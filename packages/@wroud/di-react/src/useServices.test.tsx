// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, screen } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServices } from "./useServices.js";
import {
  createService,
  injectable,
  lazy,
  ServiceContainerBuilder,
} from "@wroud/di/development.js";
import { ServiceProvider } from "./ServiceProvider.js";
import { Suspense } from "react";

describe("useServices", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it("should resolve single service", async () => {
    const consoleWarn = vi.spyOn(console, "warn");
    consoleWarn.mockImplementation(() => {});
    const builder = new ServiceContainerBuilder();

    @injectable()
    class TestService {}
    const testServiceType = createService<TestService>("TestService");

    builder.addSingleton(
      testServiceType,
      lazy(() => Promise.resolve(TestService)),
    );
    const serviceProvider = builder.build();

    const { result, rerender } = renderHook(
      () => useServices(testServiceType),
      {
        wrapper: ({ children }) => (
          <Suspense fallback="loading">
            <ServiceProvider provider={serviceProvider}>
              {children}
            </ServiceProvider>
          </Suspense>
        ),
      },
    );

    expect(screen.queryByText("loading")).not.toBeNull();

    rerender();
    rerender();

    await serviceProvider.getServiceAsync(testServiceType);
    rerender();

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toBeInstanceOf(TestService);
    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Service implementation for "TestService" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
  });
  it("should resolve multiple services", async () => {
    const consoleWarn = vi.spyOn(console, "warn");
    consoleWarn.mockImplementation(() => {});
    const builder = new ServiceContainerBuilder();

    @injectable()
    class TestService {}
    const testServiceType = createService<TestService>("TestService");

    @injectable()
    class TestService1 {}

    @injectable()
    class TestService2 {}

    builder
      .addSingleton(
        testServiceType,
        lazy(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(TestService), 5)),
        ),
      )
      .addSingleton(
        testServiceType,
        lazy(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(TestService1), 5),
            ),
        ),
      )
      .addSingleton(
        testServiceType,
        lazy(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(TestService2), 5),
            ),
        ),
      );

    const serviceProvider = builder.build();

    const { result, rerender } = renderHook(
      () => useServices(testServiceType),
      {
        wrapper: ({ children }) => (
          <Suspense fallback="loading">
            <ServiceProvider provider={serviceProvider}>
              {children}
            </ServiceProvider>
          </Suspense>
        ),
      },
    );

    expect(screen.queryByText("loading")).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 5));
    rerender();
    expect(screen.queryByText("loading")).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 5));
    rerender();
    expect(screen.queryByText("loading")).not.toBeNull();

    // await new Promise((resolve) => setTimeout(resolve, 5));
    // rerender();
    // expect(screen.queryByText("loading")).not.toBeNull();

    await serviceProvider.getServicesAsync(testServiceType);
    await new Promise((resolve) => setTimeout(resolve, 5));
    rerender();

    expect(result.current).toHaveLength(3);
    expect(result.current[0]).toBeInstanceOf(TestService);
    expect(result.current[1]).toBeInstanceOf(TestService1);
    expect(result.current[2]).toBeInstanceOf(TestService2);
    expect(consoleWarn).toHaveBeenCalledTimes(3);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Service implementation for "TestService" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
  });
});
