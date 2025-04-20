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
import { useService } from "./useService.js";
import {
  createService,
  injectable,
  lazy,
  Service,
  ServiceContainerBuilder,
  type ServiceType,
} from "@wroud/di/development.js";
import { ServiceProvider } from "./ServiceProvider.js";
import { Suspense } from "react";

describe("useService", () => {
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

    const { result, rerender } = renderHook(() => useService(testServiceType), {
      wrapper: ({ children }) => (
        <Suspense fallback="loading">
          <ServiceProvider provider={serviceProvider}>
            {children}
          </ServiceProvider>
        </Suspense>
      ),
    });

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

    const { result, rerender } = renderHook(() => useService(testServiceType), {
      wrapper: ({ children }) => (
        <Suspense fallback="loading">
          <ServiceProvider provider={serviceProvider}>
            {children}
          </ServiceProvider>
        </Suspense>
      ),
    });

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

  it("should dispose transient service", async () => {
    const builder = new ServiceContainerBuilder();
    const dispose = vi.fn();

    @injectable()
    class TestService extends Service {
      override dispose() {
        dispose();
      }
    }

    builder.addTransient(TestService, TestService);
    const serviceProvider = builder.build();

    const { result, rerender, unmount } = renderHook(
      () => useService(TestService),
      {
        wrapper: ({ children }) => (
          <ServiceProvider provider={serviceProvider}>
            {children}
          </ServiceProvider>
        ),
      },
    );

    let testService = result.current;
    expect(testService).toBeInstanceOf(TestService);
    expect(dispose).not.toHaveBeenCalled();

    rerender();

    expect(result.current).equal(testService);
    expect(dispose).not.toHaveBeenCalled();

    unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("should dispose transient service when changing type", async () => {
    const builder = new ServiceContainerBuilder();
    const dispose = vi.fn();

    @injectable()
    class TestService extends Service {
      override dispose() {
        dispose();
      }
    }

    @injectable()
    class TestServiceB {}

    builder
      .addTransient(TestService, TestService)
      .addSingleton(TestServiceB, TestServiceB);
    const serviceProvider = builder.build();

    const { result, rerender } = renderHook(
      (service: ServiceType<TestService> | ServiceType<TestServiceB>) =>
        useService(service),
      {
        initialProps: TestService as
          | ServiceType<TestService>
          | ServiceType<TestServiceB>,
        wrapper: ({ children }) => (
          <ServiceProvider provider={serviceProvider}>
            {children}
          </ServiceProvider>
        ),
      },
    );

    expect(result.current).toBeInstanceOf(TestService);
    expect(dispose).not.toHaveBeenCalled();

    rerender(TestServiceB);

    expect(result.current).toBeInstanceOf(TestServiceB);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("should not dispose singleton service", async () => {
    const builder = new ServiceContainerBuilder();
    const dispose = vi.fn();

    @injectable()
    class TestService extends Service {
      override dispose() {
        dispose();
      }
    }

    builder.addSingleton(TestService, TestService);
    const serviceProvider = builder.build();

    const { result, rerender, unmount } = renderHook(
      () => useService(TestService),
      {
        wrapper: ({ children }) => (
          <ServiceProvider provider={serviceProvider}>
            {children}
          </ServiceProvider>
        ),
      },
    );

    let testService = result.current;
    expect(testService).toBeInstanceOf(TestService);
    expect(dispose).not.toHaveBeenCalled();

    rerender();

    expect(result.current).equal(testService);
    expect(dispose).not.toHaveBeenCalled();

    unmount();
    expect(dispose).not.toHaveBeenCalled();
  });
  it("should not dispose scoped service", async () => {
    const builder = new ServiceContainerBuilder();
    const dispose = vi.fn();

    @injectable()
    class TestService extends Service {
      override dispose() {
        dispose();
      }
    }

    builder.addScoped(TestService, TestService);
    const serviceProvider = builder.build();
    const scopeServiceProvider = serviceProvider.createScope().serviceProvider;

    const { result, rerender, unmount } = renderHook(
      () => useService(TestService),
      {
        wrapper: ({ children }) => (
          <ServiceProvider provider={scopeServiceProvider}>
            {children}
          </ServiceProvider>
        ),
      },
    );

    let testService = result.current;
    expect(testService).toBeInstanceOf(TestService);
    expect(dispose).not.toHaveBeenCalled();

    rerender();

    expect(result.current).equal(testService);
    expect(dispose).not.toHaveBeenCalled();

    unmount();
    expect(dispose).not.toHaveBeenCalled();
  });
});
