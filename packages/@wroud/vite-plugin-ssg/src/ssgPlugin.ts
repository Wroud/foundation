import { existsSync } from "node:fs";
import nodePath from "node:path";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { globSync } from "tinyglobby";
import type { EnvironmentOptions, PluginOption, Rollup } from "vite";
import type { SsgPluginOptions } from "./SsgPluginOptions.js";
import { ssgBuildApp } from "./resolvers/ssgBuildApp.js";

export * from "./react/IndexComponent.js";

const ENTRY_RSC = "@wroud/vite-plugin-ssg/entry-rsc";
const ENTRY_SSR = "@wroud/vite-plugin-ssg/entry-ssr";
const ENTRY_BROWSER = "@wroud/vite-plugin-ssg/entry-browser";
const CLIENT_INDEX = "@wroud/vite-plugin-ssg/client-index";
const ENTRY_GLOB = "**/*.entry.{tsx,ts,jsx,js}";
const RSC_ENTRY_GLOB = "**/*.entry.rsc.{tsx,ts,jsx,js}";

const HMR_ACCEPT = `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;

export const ssgPlugin = (
  pluginOptions: SsgPluginOptions = {},
): PluginOption => {
  let entryPath: string | undefined;
  let rscEntryPath: string | undefined;
  let pendingInputWarning: string | undefined;

  return [
    {
      name: "@wroud/vite-plugin-ssg",
      enforce: "pre",

      config(userConfig, env) {
        if (pluginOptions.csp && userConfig.html?.cspNonce) {
          throw new Error(
            "[vite-plugin-ssg] `csp` (hash-based CSP) and Vite's " +
              "`html.cspNonce` are mutually exclusive: a static hash policy " +
              "cannot also carry a per-request nonce. Remove one.",
          );
        }

        const reactPluginNames = new Set([
          "vite:react-babel",
          "vite:react-swc",
          "vite:react-oxc",
        ]);
        let reactInstances = 0;
        const stack: PluginOption[] = [...(userConfig.plugins ?? [])];
        while (stack.length) {
          const p = stack.pop();
          if (Array.isArray(p)) {
            stack.push(...p);
          } else if (
            p &&
            typeof p === "object" &&
            "name" in p &&
            reactPluginNames.has(p.name)
          ) {
            reactInstances++;
          }
        }
        if (reactInstances > 1) {
          throw new Error(
            "[vite-plugin-ssg] multiple @vitejs/plugin-react instances detected. " +
              "ssgPlugin already includes @vitejs/plugin-react; remove react() " +
              "from your plugins, or pass `react: false` to ssgPlugin to keep your own.",
          );
        }

        const root = nodePath.resolve(userConfig.root ?? process.cwd());
        const outDir = userConfig.build?.outDir ?? "dist";

        if (!env.isPreview) {
          const ignoreDirs: string[] = [];
          const publicDir = userConfig.publicDir ?? "public";
          if (publicDir) {
            ignoreDirs.push(publicDir);
          }
          for (const environment of Object.values(
            userConfig.environments ?? {},
          )) {
            if (environment?.build?.outDir) {
              ignoreDirs.push(environment.build.outDir);
            }
          }
          entryPath = resolveEntry(
            root,
            outDir,
            ignoreDirs,
            pluginOptions.entry,
          );
          rscEntryPath = resolveRscEntry(
            root,
            outDir,
            ignoreDirs,
            pluginOptions.rscEntry,
          );
          if (!entryPath && !rscEntryPath) {
            throw new Error(
              `[vite-plugin-ssg] no entry found under ${root}. Create an app entry ` +
                `("*.entry.{tsx,ts,jsx,js}", client code), a react-server entry ` +
                `("*.entry.rsc.{tsx,ts,jsx,js}"), or set the \`entry\`/\`rscEntry\` options.`,
            );
          }
        }

        const discardedInputs: string[] = [];

        if (userConfig.build?.rollupOptions) {
          discardedInputs.push(
            ...rollupInputNames(userConfig.build.rollupOptions.input),
          );
          userConfig.build.rollupOptions.input = undefined;
        }

        userConfig.environments = {
          ...userConfig.environments,
          client: mergeEnv(
            userConfig.environments?.["client"],
            ENTRY_BROWSER,
            outDir,
            discardedInputs,
          ),
          ssr: mergeEnv(
            userConfig.environments?.["ssr"],
            ENTRY_SSR,
            `${outDir}-ssr`,
            discardedInputs,
          ),
          rsc: mergeEnv(
            userConfig.environments?.["rsc"],
            ENTRY_RSC,
            `${outDir}-rsc`,
            discardedInputs,
          ),
        };

        if (discardedInputs.length) {
          pendingInputWarning =
            `[vite-plugin-ssg] ignoring rollupOptions.input entries: ` +
            `${Array.from(new Set(discardedInputs)).join(", ")}. ` +
            `Entries are defined via *.entry files or the \`entry\`/\`rscEntry\` options.`;
        }

        userConfig.rsc = {
          ...userConfig.rsc,
          serverHandler: env.isPreview ? false : userConfig.rsc?.serverHandler,
        };

        if (env.isPreview) {
          userConfig.appType = "mpa";
        }
      },

      configResolved(config) {
        if (pendingInputWarning) {
          config.logger.warn(pendingInputWarning);
          pendingInputWarning = undefined;
        }
      },

      configEnvironment(_name, config) {
        config.optimizeDeps ??= {};
        if (!config.optimizeDeps.exclude?.includes("@wroud/vite-plugin-ssg")) {
          config.optimizeDeps.exclude = [
            ...(config.optimizeDeps.exclude ?? []),
            "@wroud/vite-plugin-ssg",
          ];
        }
        if (config.optimizeDeps.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.map(
            (entry) =>
              entry.startsWith("@vitejs/plugin-rsc")
                ? `@wroud/vite-plugin-ssg > ${entry}`
                : entry,
          );
        }
      },

      resolveId: {
        order: "pre",
        handler(source) {
          const bare = source.startsWith("\0") ? source.slice(1) : source;
          if (
            bare === ENTRY_RSC ||
            bare === ENTRY_SSR ||
            bare === ENTRY_BROWSER ||
            bare === CLIENT_INDEX
          ) {
            return "\0" + bare;
          }
          return undefined;
        },
      },

      load(id) {
        if (id === "\0" + CLIENT_INDEX && entryPath) {
          return `
"use client";

import entry from ${JSON.stringify(entryPath)};
import { unwrapIndex } from "@wroud/vite-plugin-ssg/react/rsc/client-index";

export default unwrapIndex(entry);
`;
        }

        if (id === "\0" + ENTRY_SSR) {
          const config = this.environment.config;
          return `
import { createSsrRuntime } from "@wroud/vite-plugin-ssg/react/rsc/server-ssr";
${entryPath ? `import * as entry from ${JSON.stringify(entryPath)};` : "const entry = undefined;"}

const ssr = createSsrRuntime(entry, { base: ${JSON.stringify(config.base)} });

export const renderHtml = ssr.renderHtml;
export const getStaticPaths = ssr.getStaticPaths;
${HMR_ACCEPT}`;
        }

        if (id === "\0" + ENTRY_BROWSER) {
          return `
import { hydrate } from "@wroud/vite-plugin-ssg/react/rsc/browser";
${entryPath ? `import * as entry from ${JSON.stringify(entryPath)};` : "const entry = undefined;"}

hydrate(entry);
`;
        }

        if (id === "\0" + ENTRY_RSC) {
          const config = this.environment.config;
          const runtimeOptions = {
            base: config.base,
            cspNonce: config.html?.cspNonce,
          };
          return `
import { createSsgRuntime } from "@wroud/vite-plugin-ssg/react/rsc/server-rsc";
${entryPath ? `import Index from ${JSON.stringify(CLIENT_INDEX)};` : "const Index = undefined;"}
${rscEntryPath ? `import rsc from ${JSON.stringify(rscEntryPath)};` : "const rsc = undefined;"}

export const runtime = createSsgRuntime({ Index, rsc }, {
  ...${JSON.stringify(runtimeOptions)},${
    rscEntryPath
      ? `\n  css: import.meta.viteRsc.loadCss(${JSON.stringify(rscEntryPath)}),`
      : ""
  }
});

export default runtime.handler;
${HMR_ACCEPT}`;
        }

        return undefined;
      },
    },
    pluginOptions.react === false ? null : react(),
    ...rsc(),
    ssgBuildApp({
      renderTimeout: pluginOptions.renderTimeout,
      prerender: pluginOptions.prerender,
      csp: pluginOptions.csp,
    }),
  ];
};

function rollupInputNames(input: Rollup.InputOption | undefined): string[] {
  if (!input) {
    return [];
  }
  if (typeof input === "string") {
    return [input];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return Object.keys(input);
}

function mergeEnv(
  existing: EnvironmentOptions | undefined,
  input: string,
  outDir: string,
  discardedInputs: string[],
): EnvironmentOptions {
  discardedInputs.push(
    ...rollupInputNames(existing?.build?.rollupOptions?.input),
  );
  return {
    ...existing,
    build: {
      ...existing?.build,
      outDir: existing?.build?.outDir ?? outDir,
      rollupOptions: {
        ...existing?.build?.rollupOptions,
        input: { index: input },
      },
    },
  };
}

function resolveExplicit(
  root: string,
  explicit: string,
  optionName: string,
): string {
  const resolved = nodePath.isAbsolute(explicit)
    ? explicit
    : nodePath.resolve(root, explicit);
  if (!existsSync(resolved)) {
    throw new Error(
      `[vite-plugin-ssg] entry file not found: ${resolved} (from \`${optionName}\` option "${explicit}")`,
    );
  }
  return resolved;
}

function toIgnoreRel(root: string, dir: string): string | undefined {
  const rel = nodePath
    .relative(root, nodePath.resolve(root, dir))
    .split(nodePath.sep)
    .join("/");
  return rel && !rel.startsWith("..") ? rel : undefined;
}

function globEntries(
  root: string,
  outDir: string,
  ignoreDirs: string[],
  glob: string,
): string[] {
  const ignore = ["**/node_modules/**"];
  const outDirRel = toIgnoreRel(root, outDir);
  if (outDirRel) {
    ignore.push(
      `${outDirRel}/**`,
      `${outDirRel}-ssr/**`,
      `${outDirRel}-rsc/**`,
    );
  }
  for (const dir of ignoreDirs) {
    const rel = toIgnoreRel(root, dir);
    if (rel) {
      ignore.push(`${rel}/**`);
    }
  }
  return globSync(glob, { cwd: root, absolute: true, ignore });
}

function resolveEntry(
  root: string,
  outDir: string,
  ignoreDirs: string[],
  explicit?: string,
): string | undefined {
  if (explicit) {
    return resolveExplicit(root, explicit, "entry");
  }

  const matches = globEntries(root, outDir, ignoreDirs, ENTRY_GLOB);

  if (matches.length > 1) {
    throw new Error(
      `[vite-plugin-ssg] multiple entry files found, expected one:\n${matches.join("\n")}`,
    );
  }

  return matches[0];
}

function resolveRscEntry(
  root: string,
  outDir: string,
  ignoreDirs: string[],
  explicit?: string,
): string | undefined {
  if (explicit) {
    return resolveExplicit(root, explicit, "rscEntry");
  }

  const matches = globEntries(root, outDir, ignoreDirs, RSC_ENTRY_GLOB);

  if (matches.length > 1) {
    throw new Error(
      `[vite-plugin-ssg] multiple rsc entry files found, expected one:\n${matches.join("\n")}`,
    );
  }

  return matches[0];
}
