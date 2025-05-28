import type { PluginOption } from "vite";
import { globSync } from "tinyglobby";
import picomatch from "picomatch";
import nodePath from "node:path";
import MagicString from "magic-string";
import frontMatter from "front-matter";
import {
  createVirtualStoriesModule,
  isVirtualStoriesModule,
} from "./virtualStoriesModule.js";

const DEFAULT_STORIES_INCLUDE = [
  "**/*.stories.ts",
  "**/*.stories.tsx",
  "**/*.stories.js",
  "**/*.stories.jsx",
];

const DEFAULT_DOCS_INCLUDE = ["**/*.stories.md", "../src/**/*.stories.md"];

interface IOptions {
  path?: string;
  imports?: string[];
  stories?: string[];
  docs?: string[];
  exclude?: string[];
  bundle?: boolean;
}

export function playground({
  path = "playground",
  imports,
  stories = DEFAULT_STORIES_INCLUDE,
  docs: docs = DEFAULT_DOCS_INCLUDE,
  exclude,
  bundle = false,
}: IOptions = {}): PluginOption {
  const storiesMatcher = picomatch(stories, { dot: true });
  const docsMatcher = picomatch(docs, { dot: true });

  let root: string | undefined;

  function getPlaygroundSsgModuleId() {
    return `/@ssg/${getPlaygroundModuleId()}`;
  }

  function getPlaygroundModuleId(root?: string): string {
    if (root) {
      return nodePath.posix.resolve(root, path) + "/index.js";
    }
    return path + "/index.js";
  }

  function getStoriesModuleId(root?: string) {
    return getPlaygroundModuleId(root) + "?stories";
  }

  return [
    {
      name: "@wroud/vite-plugin-playground",
      configResolved: {
        handler(config) {
          root = config.root;

          if (config.command === "serve") {
            config.optimizeDeps.include = [
              ...(config.optimizeDeps.include || []),
              "react",
              "react-dom",
              "react-dom/client",
              "react/jsx-runtime",
              "@wroud/vite-plugin-playground > @ariakit/react",
              "@wroud/vite-plugin-playground > react-markdown",
            ];
            config.optimizeDeps.exclude = [
              ...(config.optimizeDeps.exclude || []),
              "@wroud/vite-plugin-ssg/react/client",
              "@wroud/vite-plugin-playground/app/index",
            ];
          }

          if (config.environments["ssr"]) {
            let noExternal = config.environments["ssr"].resolve.noExternal;

            if (noExternal === true) {
              return;
            }

            if (!Array.isArray(noExternal)) {
              noExternal = [noExternal];
            }

            config.environments["ssr"].resolve.noExternal = [
              ...noExternal,
              "@wroud/vite-plugin-playground",
            ];
          }
        },
      },
      buildStart: {
        handler() {
          if (this.environment.config.command === "build" && bundle) {
            this.emitFile({
              id: getPlaygroundSsgModuleId(),
              name: path + "/index",
              fileName:
                this.environment.name === "ssr"
                  ? path + "/index.js"
                  : undefined,
              type: "chunk",
              preserveSignature: "strict",
            });
          }
        },
      },
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          // ignore IDs with null character, these belong to other plugins
          if (source && source.includes("\0")) return null;

          const config = this.environment.config;
          if (source === getStoriesModuleId(config.root)) {
            return source;
          }

          if (root && importer === getStoriesModuleId(config.root)) {
            return this.resolve(nodePath.posix.join(root, source), root);
          }
          return null;
        },
      },
      load: {
        order: "pre",
        handler(id) {
          const config = this.environment.config;
          if (id === getStoriesModuleId(config.root)) {
            try {
              const storyFiles = stories
                .flatMap((pattern) => {
                  try {
                    return globSync(pattern, { cwd: root, ignore: exclude });
                  } catch (err) {
                    this.warn(
                      `Failed to process glob pattern "${pattern}": ${err instanceof Error ? err.message : String(err)}`,
                    );
                    return [];
                  }
                })
                .concat(
                  docs.flatMap((pattern) => {
                    try {
                      return globSync(pattern, { cwd: root, ignore: exclude });
                    } catch (err) {
                      this.warn(
                        `Failed to process glob pattern "${pattern}": ${err instanceof Error ? err.message : String(err)}`,
                      );
                      return [];
                    }
                  }),
                )
                .map((file) => `./${file}`)
                .concat(imports?.map(createVirtualStoriesModule) ?? [])
                .map((file) => {
                  const path = file.replace(/\.(ts|js)x?$/, ".js");
                  return `import "${path}";`;
                })
                .join("\n");

              return {
                code: storyFiles,
                moduleSideEffects: true,
                moduleType: "js",
              };
            } catch (err) {
              this.error(
                `Failed to generate stories module: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          return null;
        },
      },

      transform: {
        order: "pre",
        handler(code, id) {
          if (storiesMatcher(id) && this.environment.mode === "dev") {
            const s = addDevHmr(code);
            return {
              code: s.toString(),
              map: s.generateMap({ hires: true }),
            };
          }

          if (docsMatcher(id)) {
            let {
              attributes: { title, describe },
              body,
            } = (frontMatter as unknown as typeof frontMatter.default)<{
              title?: string;
              describe?: string;
            }>(code);

            if (!title) {
              title = nodePath.posix.basename(id, nodePath.posix.extname(id));
            }

            if (!describe) {
              describe = "";
            }

            code = `
import { MarkdownView } from "@wroud/playground-react/views";
import { describe, doc } from "@wroud/playground-react";

describe(${JSON.stringify(describe)}, () => doc(${JSON.stringify(title)}, MarkdownView, { content: ${JSON.stringify(body)} }));
`;

            if (this.environment.mode === "dev") {
              const s = addDevHmr(code);
              return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
              };
            }

            return {
              code,
            };
          }

          return null;
        },
      },
    },
    {
      name: "@wroud/vite-plugin-playground-resolver",
      resolveId: {
        order: "post",
        async handler(source, importer, resolveOptions) {
          // ignore IDs with null character, these belong to other plugins
          if (source && source.includes("\0")) return null;

          const config = this.environment.config;
          const { custom = {} } = resolveOptions;
          const {
            "@wroud/vite-plugin-playground/resolve": playgroundResolve = {},
          } = custom;
          const { resolved: alreadyResolved } = playgroundResolve;

          if (alreadyResolved) {
            return alreadyResolved;
          }

          if (importer && importer.includes("\0")) {
            importer = undefined;
          }

          let absoluteSource = source;
          if (!absoluteSource.startsWith("/") && importer) {
            absoluteSource = nodePath.posix.resolve(
              nodePath.posix.dirname(importer),
              absoluteSource,
            );
          }

          let [sourcePath, params] = absoluteSource.split("?");
          const suffix = params ? `?${params}` : "";

          if (
            sourcePath === getPlaygroundModuleId(config.root) ||
            sourcePath + ".js" === getPlaygroundModuleId(config.root)
          ) {
            const resolvedId = getPlaygroundModuleId(config.root);
            const resolvedIdFull = resolvedId + suffix;

            // This way, plugins may attach additional meta information to the
            // resolved id or make it external. We do not skip node-resolve here
            // because another plugin might again use `this.resolve` in its
            // `resolveId` hook, in which case we want to add the correct
            // `moduleSideEffects` information.
            const resolvedResolved = await this.resolve(
              resolvedIdFull,
              importer,
              {
                ...resolveOptions,
                skipSelf: false,
                custom: {
                  ...custom,
                  "@wroud/vite-plugin-playground/resolve": {
                    ...custom["@wroud/vite-plugin-playground/resolve"],
                    resolved: resolvedId,
                  },
                },
              },
            );

            if (resolvedResolved) {
              // Handle plugins that manually make the result external
              if (resolvedResolved.external) {
                return false;
              }
              // Allow other plugins to take over resolution. Rollup core will not
              // change the id if it corresponds to an existing file
              if (resolvedResolved.id !== resolvedIdFull) {
                return resolvedResolved;
              }
              // Pass on meta information added by other plugins
              return { id: resolvedIdFull, meta: resolvedResolved.meta };
            }
          }
          return null;
        },
      },
    },
    {
      name: "@wroud/vite-plugin-playground-index",
      load: {
        async handler(id) {
          const config = this.environment.config;
          if (id === getPlaygroundModuleId(config.root)) {
            return {
              code: `import { configure } from "@wroud/vite-plugin-playground/app/index";
            import "${getStoriesModuleId(config.root)}";
            export default configure(${JSON.stringify(path)});`,
              moduleType: "js",
            };
          }

          return null;
        },
      },
    },
    {
      name: "@wroud/vite-plugin-playground-stories",
      load: {
        order: "pre",
        handler(id) {
          if (isVirtualStoriesModule(id)) {
            return {
              code: `import.meta.glob(${JSON.stringify([...stories, ...docs].map((pattern) => `./${pattern}`))}, { eager: true })`,
              moduleSideEffects: "no-treeshake",
              moduleType: "js",
            };
          }
          return null;
        },
      },
    },
  ];
}

function addDevHmr(code: string) {
  const s = new MagicString(code);

  // Prepend HMR setup code
  s.prepend(`
import { beginUnsubscribeCollection, endUnsubscribeCollection } from "@wroud/playground-react/registry";

if(import.meta.hot) {
  import.meta.hot.accept();
  beginUnsubscribeCollection();
}

`);

  // Append HMR cleanup code
  s.append(`

if(import.meta.hot) {
  const __VITE_PLUGIN_PLAYGROUND_CLEANUP = endUnsubscribeCollection();
  import.meta.hot.dispose(() => {
    __VITE_PLUGIN_PLAYGROUND_CLEANUP.reverse().forEach((fn) => fn());
  });
}
`);

  return s;
}
