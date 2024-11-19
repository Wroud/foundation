import path from "node:path";
import {
  type Connect,
  createServerModuleRunner,
  type PreviewServer,
  send,
  type ViteDevServer,
  type PluginOption,
  type HtmlTagDescriptor,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";
import { isUrlId, removeUrlQuery } from "./utils/removeUrlQuery.js";
import { cleanUrl } from "./utils/cleanUrl.js";
import { isSSgId, removeSSgQuery } from "./utils/ssgQuery.js";
import { isSSrServerId } from "./utils/ssrServerQuery.js";
import { isSSrClientId } from "./utils/ssrClientQuery.js";
import { isMainId, removeMainQuery } from "./utils/mainQuery.js";
import {
  addQueryParam,
  parseQueryParams,
  removeQueryParam,
} from "./utils/queryParam.js";
import {
  cleanViteResolveUrl,
  isViteResolveUrl,
} from "./utils/isViteResolveUrl.js";
import type { BoundServerRenderFunction } from "./react/server.js";
import { mapHtmlTagsToReactTags } from "./react/mapHtmlTagsToReactTags.js";
import { parseHtmlTagsFromHtml } from "./parseHtmlTagsFromHtml.js";
import type { OutputAsset, OutputChunk } from "rollup";
import MagicString from "magic-string";
import { isSSgHtmlTagsId } from "./utils/ssgHtmlTags.js";

export * from "./react/IndexComponent.js";

interface SSGOptions {
  renderTimeout?: number;
}

export const ssgPlugin = (
  pluginOptions: SSGOptions = {
    renderTimeout: 10000,
  },
): PluginOption => {
  return [
    {
      name: "wroud:ssg",
      enforce: "post",

      config(userConfig, env) {
        userConfig.environments = {
          ...userConfig.environments,
          ssr: {
            ...userConfig.environments?.["ssr"],
            optimizeDeps: {
              ...userConfig.environments?.["ssr"]?.optimizeDeps,
              noDiscovery: false,
            },
            build: {
              ...userConfig.environments?.["ssr"]?.build,
              ssr: true,
              emptyOutDir: true,
            },
          },
          client: {
            ...userConfig.environments?.["client"],
            build: {
              ...userConfig.environments?.["client"]?.build,
              emptyOutDir: false,
            },
          },
        };
        userConfig.builder = {
          async buildApp(builder) {
            await builder.build(builder.environments["ssr"]!);
            await builder.build(builder.environments["client"]!);
          },
        };
      },
      configureServer: {
        order: "pre",
        handler(server) {
          const moduleRunner = createServerModuleRunner(
            server.environments.ssr,
            {
              hmr: { logger: false },
            },
          );

          return () => {
            server.middlewares.use(
              indexHtmlMiddleware(moduleRunner, server, pluginOptions),
            );
          };
        },
      },
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          if (source.endsWith("-virtual.html")) {
            return { id: source, moduleSideEffects: true };
          }
          const config = this.environment.config;

          if (isViteResolveUrl(source)) {
            const params = parseQueryParams(source);

            if ("importer" in params) {
              importer = path.join(config.root, params["importer"]!);
              source = removeQueryParam(source, "importer");
            }

            source = cleanViteResolveUrl(source);
            return await this.resolve(source, importer, options);
          }

          if (
            (isUrlId(source) ||
              isMainId(source) ||
              config?.assetsInclude(cleanUrl(source))) &&
            this.environment.name === "ssr"
          ) {
            source = `\0ssg-url:${source}`;
            if (importer !== undefined) {
              const relativeImporter = path.isAbsolute(importer)
                ? path.relative(config.root, importer)
                : importer;
              source = addQueryParam(source, "importer", relativeImporter);
            }
            return source;
          }

          if (isSSgId(source)) {
            if (this.environment.name === "ssr") {
              return await this.resolve(
                addQueryParam(removeSSgQuery(source), "ssr-server"),
                importer,
                options,
              );
            } else {
              if (config.command === "build") {
                this.emitFile({
                  id: path.join(
                    path.dirname(source),
                    path.basename(cleanUrl(source)) + "-virtual.html",
                  ),
                  type: "chunk",
                  importer: source,
                });
              }
              return await this.resolve(
                addQueryParam(removeSSgQuery(source), "ssr-client"),
                importer,
                options,
              );
            }
          }

          return undefined;
        },
      },

      load: {
        order: "pre",
        async handler(id) {
          if (id.endsWith("-virtual.html")) {
            return "";
          }
          const config = this.environment.config;

          if (isViteResolveUrl(id)) {
            return {
              code: `export default await _viteResolveUrl(${JSON.stringify(id)});`,
            };
          }

          if (isMainId(id)) {
            if (config.command === "serve") {
              id = JSON.stringify(
                (config.server.origin || "") +
                  config.base +
                  path.join(
                    "@fs",
                    addQueryParam(removeMainQuery(id), "ssr-client"),
                  ),
              );
            } else {
              id = `import.meta.ROLLUP_FILE_URL_${this.emitFile({
                type: "chunk",
                id: addQueryParam(removeMainQuery(id), "ssr-client"),
              })}`;
            }

            return {
              code: `
                export default ${id};
              `,
            };
          }

          if (isSSrServerId(id)) {
            return {
              code: `
                import { render as renderServer } from "@wroud/vite-plugin-ssg/react/server";
                import Index from "./${path.basename(cleanUrl(id))}";

                export async function render(htmlTags, context, timeout) {
                  return await renderServer(Index, htmlTags, context, timeout);
                }
              `,
            };
          }

          if (isSSrClientId(id)) {
            return {
              code: `
                import { hydrate } from "@wroud/vite-plugin-ssg/react/client";
                import htmlTags from "./${addQueryParam(path.basename(cleanUrl(id)), "ssg-html-tags")}";
                import Index from "./${path.basename(cleanUrl(id))}";
                import { hydrateRoot } from "react-dom/client";
                const context = {}

                hydrate(Index, htmlTags, context);
              `,
              moduleSideEffects: true,
            };
          }

          if (isSSgHtmlTagsId(id)) {
            return {
              code: `export default __VITE_SSG_HTML_TAGS__;`,
            };
          }

          return undefined;
        },
      },
      async generateBundle(options, bundle) {
        const virtualChunks = new Map(
          Object.entries(bundle).filter(([, chunk]) =>
            chunk.fileName.endsWith("-virtual.html"),
          ) as [string, OutputAsset][],
        );

        for (const [key] of virtualChunks) {
          delete bundle[key];
        }
        const config = this.environment.config;
        for (const [, virtualHtmlChunk] of virtualChunks) {
          const mainId = addQueryParam(
            virtualHtmlChunk.originalFileNames[0]?.replace(
              "-virtual.html",
              "",
            ) || "",
            "ssr-client",
          );
          const mainChunk = Object.values(bundle).find(
            (c) => c.type == "chunk" && c.facadeModuleId === mainId,
          );
          if (mainChunk?.type !== "chunk" || !mainChunk.isEntry) {
            continue;
          }

          if (
            mainChunk.facadeModuleId &&
            isSSrClientId(mainChunk.facadeModuleId)
          ) {
            Object.assign(globalThis, {
              _viteResolveUrl: async (url: string) => {
                const resolveId = await this.resolve(
                  url,
                  mainChunk.facadeModuleId!,
                  { skipSelf: false },
                );

                if (!resolveId) {
                  return url;
                }

                const chunkOrAsset = Object.values(bundle).find((chunk) => {
                  if (
                    chunk.type === "asset" &&
                    chunk.originalFileNames.includes(
                      removeUrlQuery(resolveId.id),
                    )
                  ) {
                    return true;
                  }

                  if (chunk.type === "chunk" && isMainId(resolveId.id)) {
                    return (
                      chunk.facadeModuleId ===
                      addQueryParam(
                        removeQueryParam(resolveId.id, "ssg-main"),
                        "ssr-client",
                      )
                    );
                  }

                  return false;
                });

                if (!chunkOrAsset) {
                  return url;
                }

                return config.base + chunkOrAsset.fileName;
              },
            });

            const { render } = await import(
              path.join(
                config.root,
                config.build.outDir,
                mainChunk.name + ".js",
              )
            );

            let htmlTags: HtmlTagDescriptor[] = [
              {
                tag: "meta",
                attrs: {
                  property: "base",
                  content:
                    config?.command === "serve"
                      ? (config.server.origin || "") + config.base
                      : "" + config?.base,
                },
                injectTo: "head",
              },
            ];

            const analyzedChunk = new Map<OutputChunk, number>();
            htmlTags.push(
              ...parseHtmlTagsFromHtml(String(virtualHtmlChunk.source)),
            );

            const getCssTagsForChunk = (
              c: typeof mainChunk,
              seen: Set<string> = new Set(),
            ): HtmlTagDescriptor[] => {
              const tags: HtmlTagDescriptor[] = [];
              if (!analyzedChunk.has(c)) {
                analyzedChunk.set(c, 1);
                c.imports.forEach((file) => {
                  const importee = bundle[file];
                  if (importee?.type === "chunk") {
                    tags.push(...getCssTagsForChunk(importee, seen));
                  }
                });
              }

              c.viteMetadata!.importedCss.forEach((file) => {
                if (!seen.has(file)) {
                  seen.add(file);
                  tags.push({
                    tag: "link",
                    injectTo: "head",
                    attrs: {
                      rel: "stylesheet",
                      crossorigin: true,
                      href: config.base + file,
                    },
                  });
                }
              });

              return tags;
            };

            htmlTags.push(...getCssTagsForChunk(mainChunk));
            const s = new MagicString(mainChunk.code);
            s.replace("__VITE_SSG_HTML_TAGS__", JSON.stringify(htmlTags));

            mainChunk.code = s.toString();
            if (mainChunk.map) {
              mainChunk.map = s.generateMap();
            }

            const source = await (render as BoundServerRenderFunction)(
              mapHtmlTagsToReactTags(htmlTags),
              {
                cspNonce: config.html?.cspNonce,
                base: config.base,
              },
              pluginOptions.renderTimeout,
            );
            this.emitFile({
              type: "asset",
              fileName: mainChunk.name + ".html",
              source,
            });
          }
        }
      },
    },
  ];
};

function indexHtmlMiddleware(
  moduleRunner: ModuleRunner,
  server: ViteDevServer | PreviewServer,
  pluginOptions: SSGOptions,
): Connect.NextHandleFunction {
  const isDev = "pluginContainer" in server;

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return async function viteIndexHtmlMiddleware(req, res, next) {
    if (res.writableEnded || !isDev) {
      return next();
    }

    let url = cleanUrl(req.url);
    if (url?.endsWith(".html") && req.headers["sec-fetch-dest"] !== "script") {
      const headers = server.config.server.headers;

      try {
        Object.assign(globalThis, {
          _viteResolveUrl: async (url: string) =>
            (server.config.server.origin || "") + server.config.base + url,
        });
        // const module = await server.moduleGraph.ensureEntryFromUrl(
        //   entry.main!.entry,
        // );
        // if (module) {
        //   server.moduleGraph.invalidateModule(module);
        // }

        let htmlTags: HtmlTagDescriptor[] = [
          {
            tag: "meta",
            attrs: {
              property: "base",
              content:
                server.config?.command === "serve"
                  ? (server.config.server.origin || "") + server.config.base
                  : "" + server.config?.base,
            },
            injectTo: "head",
          },
        ];

        const html = await server.transformIndexHtml(url, "", req.originalUrl);

        htmlTags.push(...parseHtmlTagsFromHtml(html));

        const entry = path.join(
          server.config.root,
          path.relative(server.config.base, decodeURIComponent(url)),
        );

        const entryModule = await server.moduleGraph.ensureEntryFromUrl(
          entry.replace(path.extname(entry), "?ssg"),
        );

        for (const [id, module] of entryModule._moduleGraph.idToModuleMap) {
          if (isSSgHtmlTagsId(id)) {
            server.moduleGraph.updateModuleTransformResult(module, {
              code: `export default ${JSON.stringify(htmlTags)};`,
              map: null,
            });
          }
        }

        const { render } = await moduleRunner.import(
          entry.replace(path.extname(entry), "?ssg"),
        );

        return send(
          req,
          res,
          await (render as BoundServerRenderFunction)(
            htmlTags,
            {
              cspNonce: server.config.html?.cspNonce,
              base: (server.config.server.origin || "") + server.config.base,
            },
            pluginOptions.renderTimeout,
          ),
          "html",
          {
            headers,
            cacheControl: "no-cache",
          },
        );
      } catch (e) {
        return next(e);
      }
    }
    next();
  };
}
