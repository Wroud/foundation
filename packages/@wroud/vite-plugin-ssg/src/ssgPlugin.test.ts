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

describe("ssgPlugin entry as a node_modules package", () => {
  function mainPlugin(options: Parameters<typeof ssgPlugin>[0]) {
    const plugins = ssgPlugin(options) as Array<{
      name?: string;
      config?: (userConfig: unknown, env: unknown) => unknown;
      configEnvironment?: (name: string, config: any) => unknown;
    }>;
    return plugins.find((p) => p?.name === "@wroud/vite-plugin-ssg")!;
  }

  it("bundles bare package entries in ssr/rsc and excludes them from dep optimization", () => {
    const plugin = mainPlugin({ entry: "@scope/client", rscEntry: "react-app" });
    plugin.config!({}, { command: "build" });

    for (const name of ["ssr", "rsc"]) {
      const env: any = {};
      plugin.configEnvironment!(name, env);
      expect(env.resolve?.noExternal).toEqual(
        expect.arrayContaining(["@scope/client", "react-app"]),
      );
      expect(env.optimizeDeps?.exclude).toEqual(
        expect.arrayContaining(["@scope/client", "react-app"]),
      );
    }

    const client: any = {};
    plugin.configEnvironment!("client", client);
    expect(client.optimizeDeps?.exclude).toEqual(
      expect.arrayContaining(["@scope/client", "react-app"]),
    );
    expect(client.resolve?.noExternal).toBeUndefined();
  });
});
