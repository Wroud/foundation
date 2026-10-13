import { existsSync } from "node:fs";
import nodePath from "node:path";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { globSync } from "tinyglobby";
import type { EnvironmentOptions, PluginOption, Rollup } from "vite";
import type {
  SsgMount,
  SsgPluginApi,
  SsgPluginOptions,
} from "./SsgPluginOptions.js";
import { ssgBuildApp } from "./resolvers/ssgBuildApp.js";
import { normalizeMountPath } from "./utils/mounts.js";

export * from "./react/IndexComponent.js";
export type { RequestHandler, RequestMiddleware } from "./app/RscConfig.js";
export type {
  CspAlgorithm,
  SsgCspOptions,
  SsgMount,
  SsgPluginApi,
  SsgPluginOptions,
} from "./SsgPluginOptions.js";

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

interface ResolvedMount {
  path: string;
  entry?: string;
  rscEntry?: string;
}

function clientIndexId(path: string): string {
  return path ? `${CLIENT_INDEX}/${path}` : CLIENT_INDEX;
}

export const ssgPlugin = (
  pluginOptions: SsgPluginOptions = {},
): PluginOption => {
  let mounts: ResolvedMount[] = [];
  let pendingInputWarning: string | undefined;
  const entryPackages = new Set<string>();

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
        const apiMounts: SsgMount[] = [];
        const visit = (option: PluginOption): void => {
          if (Array.isArray(option)) {
            option.forEach(visit);
          } else if (option && typeof option === "object" && "name" in option) {
            if (reactPluginNames.has(option.name)) {
              reactInstances++;
            }
            const api = (option as { api?: { ssg?: SsgPluginApi } }).api?.ssg;
            apiMounts.push(...(api?.mounts ?? []));
          }
        };
        visit(userConfig.plugins ?? []);
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
          const entryPath = resolveEntry(
            root,
            outDir,
            ignoreDirs,
            ENTRY_GLOB,
            "entry",
            pluginOptions.entry,
          );
          const rscEntryPath = resolveEntry(
            root,
            outDir,
            ignoreDirs,
            RSC_ENTRY_GLOB,
            "rscEntry",
            pluginOptions.rscEntry,
          );
          mounts = [];
          if (entryPath || rscEntryPath) {
            mounts.push({ path: "", entry: entryPath, rscEntry: rscEntryPath });
          }
          for (const mount of apiMounts) {
            mounts.push(resolveMount(root, mount, mounts));
          }
          if (!mounts.length) {
            throw new Error(
              `[vite-plugin-ssg] no entry found under ${root}. Create an app entry ` +
                `("*.entry.{tsx,ts,jsx,js}", client code), a react-server entry ` +
                `("*.entry.rsc.{tsx,ts,jsx,js}"), or set the \`entry\`/\`rscEntry\` options.`,
            );
          }
          for (const mount of mounts) {
            for (const entry of [mount.entry, mount.rscEntry]) {
              if (entry && isBarePackage(entry)) {
                entryPackages.add(packageNameFromSpecifier(entry));
              }
            }
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

      configEnvironment(name, config) {
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

        if (entryPackages.size) {
          config.optimizeDeps.exclude = [
            ...(config.optimizeDeps.exclude ?? []),
            ...entryPackages,
          ];
          if (name === "ssr" || name === "rsc") {
            config.resolve ??= {};
            if (config.resolve.noExternal !== true) {
              const existing = config.resolve.noExternal;
              config.resolve.noExternal = [
                ...(Array.isArray(existing)
                  ? existing
                  : existing
                    ? [existing]
                    : []),
                ...entryPackages,
              ];
            }
          }
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
            bare === CLIENT_INDEX ||
            bare.startsWith(CLIENT_INDEX + "/")
          ) {
            return "\0" + bare;
          }
          return undefined;
        },
      },

      load(id) {
        if (id.startsWith("\0" + CLIENT_INDEX)) {
          const path = id.slice(("\0" + CLIENT_INDEX).length + 1);
          const mount = mounts.find((candidate) => candidate.path === path);
          if (!mount?.entry) {
            return undefined;
          }
          return `
"use client";

import entry from ${JSON.stringify(mount.entry)};
import { unwrapIndex } from "@wroud/vite-plugin-ssg/react/rsc/client-index";

export default unwrapIndex(entry);
`;
        }

        if (id === "\0" + ENTRY_SSR) {
          const config = this.environment.config;
          const list = mountList(mounts, (mount) =>
            mount.entry ? `load: ${lazyImport(mount.entry)}` : "",
          );
          return `
import { createSsrRuntime } from "@wroud/vite-plugin-ssg/react/rsc/server-ssr";

const ssr = createSsrRuntime([
${list}
], { base: ${JSON.stringify(config.base)} });

export const renderHtml = ssr.renderHtml;
export const getStaticPaths = ssr.getStaticPaths;
${HMR_ACCEPT}`;
        }

        if (id === "\0" + ENTRY_BROWSER) {
          const loaders = mounts
            .filter((mount) => mount.entry)
            .map(
              (mount) =>
                `  ${JSON.stringify(mount.path)}: ${lazyImport(mount.entry!)},`,
            )
            .join("\n");
          return `
import { hydrate } from "@wroud/vite-plugin-ssg/react/rsc/browser";

hydrate({
${loaders}
});
`;
        }

        if (id === "\0" + ENTRY_RSC) {
          const config = this.environment.config;
          const runtimeOptions = {
            base: config.base,
            cspNonce: config.html?.cspNonce,
          };
          const list = mountList(mounts, (mount) => {
            const imports: string[] = [];
            const fields: string[] = [];
            if (mount.entry) {
              imports.push(JSON.stringify(clientIndexId(mount.path)));
              fields.push(`Index: m${imports.length - 1}.default`);
            }
            if (mount.rscEntry) {
              imports.push(JSON.stringify(mount.rscEntry));
              fields.push(
                `rsc: m${imports.length - 1}.default`,
                `css: import.meta.viteRsc.loadCss(${JSON.stringify(mount.rscEntry)})`,
              );
            }
            const names = imports.map((_, i) => `m${i}`).join(", ");
            const loads = imports.map((spec) => `import(${spec})`).join(", ");
            return `load: async () => { const [${names}] = await Promise.all([${loads}]); return { ${fields.join(", ")} }; }`;
          });
          return `
import { createSsgRuntime } from "@wroud/vite-plugin-ssg/react/rsc/server-rsc";

export const runtime = createSsgRuntime([
${list}
], ${JSON.stringify(runtimeOptions)});

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

function lazyImport(specifier: string): string {
  return `() => import(${JSON.stringify(specifier)})`;
}

function mountList(
  mounts: readonly ResolvedMount[],
  fields: (mount: ResolvedMount) => string,
): string {
  return mounts
    .map((mount) => {
      const extra = fields(mount);
      return `  { path: ${JSON.stringify(mount.path)}${extra ? `, ${extra}` : ""} },`;
    })
    .join("\n");
}

function isVirtualSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith("\0") ||
    (!nodePath.isAbsolute(specifier) && /^[a-z][a-z0-9+.-]*:/i.test(specifier))
  );
}

function isBarePackage(specifier: string): boolean {
  return (
    !nodePath.isAbsolute(specifier) &&
    !specifier.startsWith(".") &&
    !isVirtualSpecifier(specifier)
  );
}

function packageNameFromSpecifier(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0]!;
}

function resolveMount(
  root: string,
  mount: SsgMount,
  existing: readonly ResolvedMount[],
): ResolvedMount {
  const path = normalizeMountPath(mount.path);
  if (!path) {
    throw new Error(
      "[vite-plugin-ssg] a plugin mount must declare a non-empty `path`; the root is reserved for the app entry",
    );
  }
  if (existing.some((candidate) => candidate.path === path)) {
    throw new Error(
      `[vite-plugin-ssg] mount path "/${path}" is declared more than once`,
    );
  }
  if (!mount.entry && !mount.rscEntry) {
    throw new Error(
      `[vite-plugin-ssg] mount "/${path}" declares neither \`entry\` nor \`rscEntry\``,
    );
  }
  return {
    path,
    entry: mount.entry && resolveExplicit(root, mount.entry, "entry"),
    rscEntry:
      mount.rscEntry && resolveExplicit(root, mount.rscEntry, "rscEntry"),
  };
}

function resolveExplicit(
  root: string,
  explicit: string,
  optionName: string,
): string {
  if (isVirtualSpecifier(explicit)) {
    return explicit;
  }
  if (!nodePath.isAbsolute(explicit) && !explicit.startsWith(".")) {
    const asFile = nodePath.resolve(root, explicit);
    if (existsSync(asFile)) {
      return asFile;
    }
    return explicit;
  }

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
  glob: string,
  optionName: string,
  explicit?: string,
): string | undefined {
  if (explicit) {
    return resolveExplicit(root, explicit, optionName);
  }

  const matches = globEntries(root, outDir, ignoreDirs, glob);

  if (matches.length > 1) {
    throw new Error(
      `[vite-plugin-ssg] multiple ${optionName === "rscEntry" ? "rsc " : ""}entry files found, expected one:\n${matches.join("\n")}`,
    );
  }

  return matches[0];
}
