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
import { isSSrClientId, removeSSrClientQuery } from "./utils/ssrClientQuery.js";
import { isMainId, removeMainQuery } from "./utils/mainQuery.js";
import {
  addQueryParam,
  parseQueryParams,
  removeQueryParam,
} from "./utils/queryParam.js";
import {
  cleanViteResolveUrl,
  createSSGResolveURI,
  isSSGResolveURI,
} from "./utils/isSSGResolveURI.js";
import type { BoundServerRenderFunction } from "./react/server.js";
import { mapHtmlTagsToReactTags } from "./react/mapHtmlTagsToReactTags.js";
import { parseHtmlTagsFromHtml } from "./parseHtmlTagsFromHtml.js";
import type { OutputAsset, OutputChunk } from "rollup";
import MagicString from "magic-string";
import { isSSgHtmlTagsId } from "./utils/ssgHtmlTags.js";
import { glob } from "tinyglobby";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { isPageURL, removePageURL } from "./utils/isPageURL.js";

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
              outDir: path.join(
                userConfig.environments?.["ssr"]?.build?.outDir ||
                  userConfig.build?.outDir ||
                  "dist",
                "server",
              ),
            },
          },
          client: {
            ...userConfig.environments?.["client"],
            build: {
              ...userConfig.environments?.["client"]?.build,
              emptyOutDir: true,
              outDir: path.join(
                userConfig.environments?.["client"]?.build?.outDir ||
                  userConfig.build?.outDir ||
                  "dist",
                "client",
              ),
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
        async handler(server) {
          const moduleRunner = createServerModuleRunner(
            server.environments.ssr,
            {
              hmr: { logger: false },
            },
          );

          for (let chunk of Object.keys(
            server.config.build.rollupOptions.input as Record<string, string>,
          )) {
            await server.warmupRequest(server.config.base + chunk);
          }

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

          if (isSSGResolveURI(source)) {
            const params = parseQueryParams(source);

            if ("importer" in params) {
              importer = path.join(config.root, params["importer"]!);
              source = removeQueryParam(source, "importer");
            }

            source = cleanViteResolveUrl(source);
            return await this.resolve(source, importer, options);
          }

          if (
            (isMainId(source) ||
              isUrlId(source) ||
              config?.assetsInclude(cleanUrl(source))) &&
            this.environment.name === "ssr"
          ) {
            const resolved = await this.resolve(source, importer, options);

            if (!resolved) {
              return undefined;
            }

            return createSSGResolveURI(resolved.id);
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
                const name = path
                  .relative(config.root, source)
                  .replace(path.extname(source), "");

                this.emitFile({
                  id: path.join(
                    path.dirname(source),
                    path.basename(cleanUrl(source)) + "-virtual.html",
                  ),
                  name,
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

          if (isPageURL(source)) {
            const resolved = await this.resolve(source, importer, options);

            if (!resolved) {
              return undefined;
            }

            if (config.command === "build") {
              let name = path
                .relative(config.root, resolved.id)
                .replace(path.extname(resolved.id), "");

              if (this.environment.name === "ssr") {
                this.emitFile({
                  id: addQueryParam(cleanUrl(resolved.id), "ssg"),
                  fileName: name + ".js",
                  name,
                  type: "chunk",
                });
                return createSSGResolveURI(resolved.id);
              } else {
                this.emitFile({
                  id: addQueryParam(cleanUrl(resolved.id), "ssg"),
                  name,
                  type: "chunk",
                });
              }
            }

            return resolved.id;
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

          if (isSSGResolveURI(id)) {
            if (isMainId(id)) {
              id = addQueryParam(removeMainQuery(id), "ssr-client");
            }
            id = removeUrlQuery(cleanViteResolveUrl(id));
            if (config.command === "serve") {
              id =
                (config.server.origin || "") +
                config.base +
                path.relative(config.root, id);
            }
            return {
              code: `
                export default ${JSON.stringify(id)};
              `,
            };
          }

          if (isMainId(id)) {
            if (config.command === "serve") {
              id = JSON.stringify(
                (config.server.origin || "") +
                  config.base +
                  path.relative(
                    config.root,
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

          const basenameCleanId = path.basename(cleanUrl(id));

          if (isSSrServerId(id)) {
            return {
              code: `
                import { render as renderServer } from "@wroud/vite-plugin-ssg/react/server";
                import Index from "./${basenameCleanId}";
                import mainScriptUrl from "./${addQueryParam(basenameCleanId, "ssg-main")}";

                export async function render(htmlTags, context, timeout) {
                  return await renderServer(Index, htmlTags, context, timeout, mainScriptUrl);
                }
              `,
            };
          }

          if (isSSrClientId(id)) {
            return {
              code: `
                import { hydrate } from "@wroud/vite-plugin-ssg/react/client";
                import htmlTags from "./${addQueryParam(basenameCleanId, "ssg-html-tags")}";
                import Index from "./${basenameCleanId}";
                import mainScriptUrl from "./${addQueryParam(basenameCleanId, "ssg-main")}";
                import { hydrateRoot } from "react-dom/client";
                const context = {}

                hydrate(Index, htmlTags, context, mainScriptUrl);
              `,
              moduleSideEffects: true,
            };
          }

          if (isSSgHtmlTagsId(id)) {
            return {
              code: `export default __VITE_SSG_HTML_TAGS__;`,
            };
          }

          if (isPageURL(id)) {
            id = removePageURL(cleanViteResolveUrl(id));
            id = path.relative(
              config.root,
              id.replace(path.extname(id), ".html"),
            );

            id = (config.server.origin || "") + config.base + id;
            return {
              code: `export default ${JSON.stringify(id)};`,
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
        const ssrConfig = config.environments["ssr"]!;
        const assetsMapping = new Map<string, string>();

        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "asset") {
            if (this.environment.name === "client") {
              for (const fileName of chunk.originalFileNames) {
                assetsMapping.set(fileName, chunk.fileName);
              }
            }
          } else if (this.environment.name === "ssr") {
            const ssgIds = chunk.moduleIds
              .filter(isSSGResolveURI)
              .map(cleanViteResolveUrl)
              .map(removeUrlQuery)
              .map((id) => {
                if (isMainId(id)) {
                  id = addQueryParam(removeMainQuery(id), "ssr-client");
                }
                return id;
              });

            if (ssgIds.length > 0) {
              await mkdir(
                path.join(
                  config.root,
                  config.build.outDir,
                  path.dirname(chunk.fileName),
                ),
                {
                  recursive: true,
                },
              );
              await writeFile(
                path.join(
                  config.root,
                  config.build.outDir,
                  chunk.fileName + ".ssg",
                ),
                JSON.stringify(ssgIds, null, 2),
              );
            }
          } else {
            if (chunk.facadeModuleId) {
              assetsMapping.set(chunk.facadeModuleId, chunk.fileName);
            }
          }
        }

        function resolveMainIdFromVirtualChunk(virtualHtmlChunk: OutputAsset) {
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
          if (
            mainChunk?.type !== "chunk" ||
            !mainChunk.isEntry ||
            !mainChunk.facadeModuleId ||
            !isSSrClientId(mainChunk.facadeModuleId)
          ) {
            return undefined;
          }
          return mainChunk;
        }

        for (const virtualChunk of virtualChunks.values()) {
          const mainChunk = resolveMainIdFromVirtualChunk(virtualChunk);
          if (!mainChunk) {
            continue;
          }
          assetsMapping.set(
            addQueryParam(
              removeSSrClientQuery(mainChunk.facadeModuleId!),
              "page-url",
            ),
            mainChunk.name + ".html",
          );
        }

        if (this.environment.name === "client") {
          const ssgFiles = await glob(["**/*.ssg"], {
            cwd: path.join(config.root, ssrConfig.build.outDir),
          });

          for (let ssg of ssgFiles) {
            ssg = path.join(config.root, ssrConfig.build.outDir, ssg);

            const ssgIds = JSON.parse(
              await readFile(ssg, { encoding: "utf-8" }),
            ) as string[];

            const serverChunkFileName = ssg.slice(0, -4);
            let serverChunk = await readFile(serverChunkFileName, {
              encoding: "utf-8",
            });

            for (const ssgId of ssgIds) {
              const asset = assetsMapping.get(ssgId);

              if (asset) {
                serverChunk = serverChunk.replaceAll(
                  ssgId,
                  path.join(config.base, asset),
                );
              } else {
                this.error(`Asset not found: ${ssgId}`);
              }
            }

            await writeFile(serverChunkFileName, serverChunk);
            await unlink(ssg);
          }
        }

        for (const [, virtualHtmlChunk] of virtualChunks) {
          const mainChunk = resolveMainIdFromVirtualChunk(virtualHtmlChunk);
          if (!mainChunk) {
            continue;
          }

          const { render } = await import(
            path.join(
              config.root,
              ssrConfig.build.outDir,
              mainChunk.name + ".js",
            )
          );

          const analyzedChunk = new Map<OutputChunk, number>();
          const htmlTags = parseHtmlTagsFromHtml(
            String(virtualHtmlChunk.source),
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
    let url = cleanUrl(req.url);
    if (res.writableEnded || !isDev || url === undefined) {
      return next();
    }

    if (url?.endsWith("/")) {
      url = url + "index.html";
    }

    if (url?.endsWith(".html") && req.headers["sec-fetch-dest"] !== "script") {
      const headers = server.config.server.headers;

      try {
        const html = await server.transformIndexHtml(url, "", req.originalUrl);

        const htmlTags = parseHtmlTagsFromHtml(html);

        const entry = path.join(
          server.config.root,
          path.relative(server.config.base, decodeURIComponent(url)),
        );

        const entryModule = await server.moduleGraph.ensureEntryFromUrl(
          entry.replace(path.extname(entry), "?ssg"),
        );

        if (entryModule.id) {
          const tagsModule = await server.moduleGraph.ensureEntryFromUrl(
            addQueryParam(cleanUrl(entryModule.id), "ssg-html-tags"),
          );

          server.moduleGraph.updateModuleTransformResult(tagsModule, {
            code: `export default ${JSON.stringify(htmlTags)};`,
            map: null,
          });
        }

        const { render } = await moduleRunner.import(
          entry.replace(path.extname(entry), "?ssg"),
        );

        const renderedHtml = await (render as BoundServerRenderFunction)(
          htmlTags,
          {
            cspNonce: server.config.html?.cspNonce,
            base: (server.config.server.origin || "") + server.config.base,
          },
          pluginOptions.renderTimeout,
        );

        return send(req, res, renderedHtml, "html", {
          headers,
          cacheControl: "no-cache",
        });
      } catch (e) {
        return next(e);
      }
    }
    next();
  };
}
