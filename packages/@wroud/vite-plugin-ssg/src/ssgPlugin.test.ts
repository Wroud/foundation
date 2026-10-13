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
    const plugin = mainPlugin({
      entry: "@scope/client",
      rscEntry: "react-app",
    });
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

describe("ssgPlugin mounts contributed through plugin api", () => {
  function mainPlugin(options: Parameters<typeof ssgPlugin>[0]) {
    const plugins = ssgPlugin(options) as Array<{
      name?: string;
      config?: (userConfig: unknown, env: unknown) => unknown;
      configEnvironment?: (name: string, config: any) => unknown;
      load?: (this: unknown, id: string) => unknown;
    }>;
    return plugins.find((p) => p?.name === "@wroud/vite-plugin-ssg")!;
  }

  function mountPlugin(mounts: unknown[]) {
    return { name: "fixture:mount", api: { ssg: { mounts } } };
  }

  it("collects mounts from nested plugin arrays and treats bare entries as packages", () => {
    const plugin = mainPlugin({
      entry: "@scope/client",
      rscEntry: "react-app",
    });
    plugin.config!(
      {
        plugins: [
          [mountPlugin([{ path: "/docs/", entry: "@scope/docs" }])],
          mountPlugin([{ path: "admin", rscEntry: "virtual:admin" }]),
        ],
      },
      { command: "build" },
    );
    const env: any = {};
    plugin.configEnvironment!("ssr", env);
    expect(env.resolve?.noExternal).toEqual(
      expect.arrayContaining(["@scope/client", "@scope/docs"]),
    );
    expect(env.resolve?.noExternal).not.toContain("virtual:admin");

    const browser = plugin.load!.call(
      { environment: { config: { base: "/" } } },
      "\0@wroud/vite-plugin-ssg/entry-browser",
    ) as string;
    expect(browser).toContain('"": () => import("@scope/client")');
    expect(browser).toContain('"docs": () => import("@scope/docs")');
    expect(browser).not.toContain("admin");
    expect(browser).not.toMatch(/^import \*/m);

    const rsc = plugin.load!.call(
      { environment: { config: { base: "/" } } },
      "\0@wroud/vite-plugin-ssg/entry-rsc",
    ) as string;
    expect(rsc).toContain(
      'path: "docs", load: async () => { const [m0] = await Promise.all([import("@wroud/vite-plugin-ssg/client-index/docs")]); return { Index: m0.default }; }',
    );
    expect(rsc).toContain(
      'path: "admin", load: async () => { const [m0] = await Promise.all([import("virtual:admin")]); return { rsc: m0.default, css: import.meta.viteRsc.loadCss("virtual:admin") }; }',
    );
    expect(rsc).not.toMatch(/^import (Index|rsc)\d/m);
  });

  it("serves a site made only of plugin mounts", () => {
    const plugin = mainPlugin({});
    expect(() =>
      plugin.config!(
        {
          root: "/nonexistent",
          plugins: [mountPlugin([{ path: "docs", entry: "@scope/docs" }])],
        },
        { command: "build" },
      ),
    ).not.toThrow();
  });

  it.each([
    [{ path: "/", entry: "@scope/docs" }, /non-empty `path`/],
    [{ path: "docs" }, /neither `entry` nor `rscEntry`/],
    [{ path: "a/../b", entry: "@scope/docs" }, /invalid mount path/],
  ])("rejects invalid mount %j", (mount, message) => {
    const plugin = mainPlugin({
      entry: "@scope/client",
      rscEntry: "react-app",
    });
    expect(() =>
      plugin.config!({ plugins: [mountPlugin([mount])] }, { command: "build" }),
    ).toThrow(message);
  });

  it("rejects duplicate mount bases", () => {
    const plugin = mainPlugin({
      entry: "@scope/client",
      rscEntry: "react-app",
    });
    expect(() =>
      plugin.config!(
        {
          plugins: [
            mountPlugin([
              { path: "docs", entry: "@scope/docs" },
              { path: "/docs", entry: "@scope/other" },
            ]),
          ],
        },
        { command: "build" },
      ),
    ).toThrow(/declared more than once/);
  });
});
