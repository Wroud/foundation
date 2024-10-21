///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, expect, it } from "vitest";
import { ServiceProvider } from "./ServiceProvider.js";
import { createService } from "./createService.js";

describe("ServiceProvider", () => {
  it("should should check for instance in static internalGetService", () => {
    expect(() =>
      ServiceProvider.internalGetService(
        {} as any,
        createService("test"),
        new Set(),
        "sync",
      ),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
  it("should should check for instance in static getDescriptor", () => {
    expect(() =>
      ServiceProvider.getDescriptor({} as any, createService("test")),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
  it("should should check for instance in static getDescriptors", () => {
    expect(() =>
      ServiceProvider.getDescriptors({} as any, createService("test")),
    ).toThrowError("provider must be an instance of ServiceProvider");
  });
});
