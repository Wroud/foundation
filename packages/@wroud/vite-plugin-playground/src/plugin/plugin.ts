import type { PluginOption } from "vite";
import type { SsgPluginApi } from "@wroud/vite-plugin-ssg";
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

const PACKAGE = "@wroud/vite-plugin-playground";
const ENTRY_ID = "virtual:@wroud/vite-plugin-playground";
const RESOLVED_ENTRY_ID = "\0" + ENTRY_ID;

export interface IPlaygroundOptions {
  path?: string;
  imports?: string[];
  stories?: string[];
  docs?: string[];
  exclude?: string[];
}

export function playground({
  path = "playground",
  imports,
  stories = DEFAULT_STORIES_INCLUDE,
  docs = DEFAULT_DOCS_INCLUDE,
  exclude,
}: IPlaygroundOptions = {}): PluginOption {
  const storiesMatcher = picomatch(stories, { dot: true });
  const docsMatcher = picomatch(docs, { dot: true });
  const api: { ssg: SsgPluginApi } = {
    ssg: { mounts: [{ path, entry: ENTRY_ID }] },
  };

  return [
    {
      name: PACKAGE,
      api,
      config(_, { command }) {
        return {
          optimizeDeps:
            command === "serve"
              ? {
                  include: [
                    "react",
                    "react-dom",
                    "react-dom/client",
                    "react/jsx-runtime",
                    `${PACKAGE} > @ariakit/react`,
                    `${PACKAGE} > react-markdown`,
                  ],
                  exclude: [PACKAGE, "@wroud/playground-react"],
                }
              : undefined,
          environments: {
            ssr: { resolve: { noExternal: [PACKAGE] } },
            rsc: { resolve: { noExternal: [PACKAGE] } },
          },
        };
      },
      resolveId: {
        order: "pre",
        handler(source) {
          return source === ENTRY_ID ? RESOLVED_ENTRY_ID : null;
        },
      },
      load(id) {
        if (id !== RESOLVED_ENTRY_ID) {
          return null;
        }
        const root = this.environment.config.root;
        let files: string[] = [];
        try {
          files = globSync([...stories, ...docs], {
            cwd: root,
            ignore: exclude,
            absolute: true,
          });
        } catch (err) {
          this.warn(
            `Failed to collect stories: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
        const specifiers = [
          ...files,
          ...(imports?.map(createVirtualStoriesModule) ?? []),
        ];
        const names = specifiers.map((_, i) => `m${i}`);
        return {
          code: [
            ...specifiers.map(
              (specifier, i) =>
                `import * as m${i} from ${JSON.stringify(specifier)};`,
            ),
            `export const modules = [${names.join(", ")}];`,
            `export { default } from ${JSON.stringify(`${PACKAGE}/app/index`)};`,
            "",
          ].join("\n"),
          moduleSideEffects: "no-treeshake",
          moduleType: "js",
        };
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

            return { code };
          }

          return null;
        },
      },
    },
    {
      name: `${PACKAGE}-stories`,
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
