import { describe, it, expect } from "vitest";
import { ssgPlugin } from "./ssgPlugin.js";

function configHook(options: Parameters<typeof ssgPlugin>[0]) {
  const plugins = ssgPlugin(options) as Array<{
    name?: string;
    config?: (userConfig: unknown, env: unknown) => unknown;
  }>;
  const main = plugins.find((p) => p?.name === "@wroud/vite-plugin-ssg");
  return (userConfig: unknown, env: unknown = { command: "build" }) =>
    main!.config!(userConfig, env);
}

describe("ssgPlugin csp option", () => {
  it("throws when `csp` and `html.cspNonce` are both set", () => {
    const run = configHook({ csp: true });
    expect(() => run({ html: { cspNonce: "x" } })).toThrow(
      /mutually exclusive/,
    );
  });

  it("throws for the object form of `csp`, not just `true`", () => {
    const run = configHook({ csp: { algorithm: "sha384" } });
    expect(() => run({ html: { cspNonce: "x" } })).toThrow(
      /mutually exclusive/,
    );
  });

  it("does not flag the conflict when only `csp` is set", () => {
    const run = configHook({ csp: true });
    let thrown: unknown;
    try {
      run({ html: {} }, { command: "serve", isPreview: true });
    } catch (error) {
      thrown = error;
    }
    expect(String((thrown as Error | undefined)?.message)).not.toMatch(
      /mutually exclusive/,
    );
  });
});
