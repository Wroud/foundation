// @vitest-environment happy-dom

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { renderHook, screen } from "@testing-library/react";
import "./tests/testingLibrary.js";
import { useServiceAsync } from "./useServiceAsync.js";
import {
  createService,
  injectable,
  lazy,
  ServiceContainerBuilder,
} from "@wroud/di";
import { ServiceProvider } from "./ServiceProvider.js";
import { Suspense } from "react";

describe("useServiceAsync", () => {
  let consoleWarn: MockInstance<
    (message?: any, ...optionalParams: any[]) => void
  >;

  beforeEach(() => {
    consoleWarn = vi.spyOn(console, "warn");
    consoleWarn.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    consoleWarn.mockReset();
  });

  afterAll(() => {
    consoleWarn.mockReset();
  });

  it("should resolve single service", async () => {
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
      () => useServiceAsync(testServiceType),
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

    expect(result.current).toBeInstanceOf(TestService);
    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Service implementation for "TestService" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
  });
  it("should resolve service with deps", async () => {
    const builder = new ServiceContainerBuilder();

    @injectable()
    class TestService1 {}
    const testServiceType1 = createService<TestService1>("TestService1");

    @injectable(() => [testServiceType1])
    class TestService {}
    const testServiceType = createService<TestService>("TestService");

    builder
      .addSingleton(
        testServiceType1,
        lazy(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(TestService1), 3),
            ),
        ),
      )
      .addSingleton(
        testServiceType,
        lazy(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(TestService), 5)),
        ),
      );

    const serviceProvider = builder.build();

    const { result, rerender } = renderHook(
      () => useServiceAsync(testServiceType),
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

    await new Promise((resolve) => setTimeout(resolve, 2));
    rerender();

    expect(screen.queryByText("loading")).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 1));
    await serviceProvider.getServiceAsync(testServiceType);
    await new Promise((resolve) => setTimeout(resolve, 2));
    rerender();

    expect(result.current).toBeInstanceOf(TestService);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Service implementation for "TestService" is async and cannot be validated synchronously. You can use builder.validate() to validate dependencies asynchronously.',
    );
  });
});
