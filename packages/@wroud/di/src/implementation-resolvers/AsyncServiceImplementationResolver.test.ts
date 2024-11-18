///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it } from "vitest";
import { AsyncServiceImplementationResolver } from "./AsyncServiceImplementationResolver.js";

describe("AsyncServiceImplementationResolver", () => {
  // it("should load the implementation", async () => {
  //   const loader = vi.fn(() => Promise.resolve("implementation"));
  //   const asyncLoader = new AsyncServiceImplementationResolver(loader);

  //   expect(asyncLoader.isLoaded()).toBe(false);

  //   const implementation = await asyncLoader.load();

  //   expect(implementation).toBe("implementation");
  //   expect(asyncLoader.isLoaded()).toBe(true);
  //   expect(asyncLoader.getImplementation()).toBe("implementation");
  // });
  // it("should throw an error if the implementation is not loaded", () => {
  //   const asyncLoader = new AsyncServiceImplementationResolver(() =>
  //     Promise.resolve("implementation"),
  //   );

  //   expect(() => asyncLoader.getImplementation()).toThrowError();
  // });
  // it("should call the loader only once", async () => {
  //   const loader = vi.fn(() => {
  //     return Promise.resolve("implementation");
  //   });
  //   const asyncLoader = new AsyncServiceImplementationResolver(loader);

  //   await asyncLoader.load();
  //   await asyncLoader.load();

  //   expect(loader).toBeCalledTimes(1);
  // });
  it("should return generic name if the implementation is not loaded", () => {
    const asyncLoader = new AsyncServiceImplementationResolver(() =>
      Promise.resolve("implementation"),
    );

    expect(asyncLoader.name).toBe("Service is not loaded yet");
  });
});
