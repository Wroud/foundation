///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>

import { describe, expect, it } from "vitest";
import { AsyncServiceImplementationResolver } from "./AsyncServiceImplementationResolver.js";
import "../debugDevelopment.js";

describe("AsyncServiceImplementationResolver development", () => {
  it("should return generic name if the implementation is not loaded", () => {
    const asyncLoader = new AsyncServiceImplementationResolver(() =>
      Promise.resolve("implementation"),
    );

    expect(asyncLoader.name).toBe(
      'Service implementation not loaded, loader: () => Promise.resolve("implementation")',
    );
  });
});
