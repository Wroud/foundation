///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it, vi } from "vitest";
import { AsyncServiceImplementationLoader } from "./AsyncServiceImplementationLoader.js";

describe("AsyncServiceImplementationLoader", () => {
  it("should load the implementation", async () => {
    const loader = vi.fn(() => Promise.resolve("implementation"));
    const asyncLoader = new AsyncServiceImplementationLoader(loader);

    expect(asyncLoader.isLoaded()).toBe(false);

    const implementation = await asyncLoader.load();

    expect(implementation).toBe("implementation");
    expect(asyncLoader.isLoaded()).toBe(true);
    expect(asyncLoader.getImplementation()).toBe("implementation");
  });
  it("should throw an error if the implementation is not loaded", () => {
    const asyncLoader = new AsyncServiceImplementationLoader(() =>
      Promise.resolve("implementation"),
    );

    expect(() => asyncLoader.getImplementation()).toThrowError();
  });
  it("should call the loader only once", async () => {
    const loader = vi.fn(() => {
      return Promise.resolve("implementation");
    });
    const asyncLoader = new AsyncServiceImplementationLoader(loader);

    await asyncLoader.load();
    await asyncLoader.load();

    expect(loader).toBeCalledTimes(1);
  });
  it("should return generic name if the implementation is not loaded", () => {
    const asyncLoader = new AsyncServiceImplementationLoader(() =>
      Promise.resolve("implementation"),
    );

    expect(asyncLoader.name).toBe("Service is not loaded yet");
  });
});
