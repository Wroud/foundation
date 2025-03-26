import nodePath from "node:path";
import {
  type Connect,
  createServerModuleRunner,
  type PreviewServer,
  send,
  type ViteDevServer,
  type PluginOption,
  type ResolvedConfig,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";
import { isUrlId, removeUrlQuery } from "./utils/removeUrlQuery.js";
import { cleanUrl } from "./utils/cleanUrl.js";
import { isSSgId, removeSSgQuery } from "./utils/ssgQuery.js";
import { isSSrServerId } from "./utils/ssrServerQuery.js";
import { isSSrClientId, removeSSrClientQuery } from "./utils/ssrClientQuery.js";
import { isMainId, removeMainQuery } from "./utils/mainQuery.js";
import { addQueryParam } from "./utils/queryParam.js";
import {
  cleanViteResolveUrl,
  createSSGResolveURI,
  isSSGResolveURI,
} from "./utils/isSSGResolveURI.js";
import type { BoundServerApiFunction } from "./react/server.js";
import { mapHtmlTagsToReactTags } from "./react/mapHtmlTagsToReactTags.js";
import { parseHtmlTagsFromHtml } from "./parseHtmlTagsFromHtml.js";
import type { OutputAsset, OutputChunk } from "rollup";
import MagicString from "magic-string";
import { isSSgHtmlTagsId } from "./utils/ssgHtmlTags.js";
import { glob } from "tinyglobby";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { isPageURL, removePageURL } from "./utils/isPageURL.js";
import { createSsgUrl, isSsgUrl, removeSsgUrl } from "./utils/isSsgUrl.js";
import { getPathsToLookup } from "./utils/getPathsToLookup.js";
import { existsSync } from "node:fs";
import { removeNoInlineQuery } from "./utils/removeNoInlineQuery.js";
import { loadServerApi } from "./api/loadServerApi.js";

export * from "./react/IndexComponent.js";

interface SSGOptions {
  renderTimeout?: number;
}

export const ssgPlugin = (
  pluginOptions: SSGOptions = {
    renderTimeout: 10000,
  },
): PluginOption => {
  const prerenderedPaths = new Set<string>();
  return [
    {
      name: "@wroud/vite-plugin-ssg",
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
              rollupOptions: {
                ...userConfig.environments?.["ssr"]?.build?.rollupOptions,
                external: [/^@wroud\/vite-plugin-ssg.*/],
              },
              outDir:
                (userConfig.environments?.["ssr"]?.build?.outDir ||
                  userConfig.build?.outDir ||
                  "dist") + "-server",
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
      buildStart: {
        handler() {
          prerenderedPaths.clear();
        },
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
            this.debug(`Resolving virtual HTML: ${source}`);
            return { id: source, moduleSideEffects: true };
          }
          const config = this.environment.config;

          if (isSSGResolveURI(source)) {
            this.debug(`Handling SSG resolve URI: ${source}`);

            source = cleanViteResolveUrl(source);
            this.debug(`Cleaned source: ${source}`);
            return await this.resolve(source, importer, options);
          }

          if (
            (isMainId(source) ||
              isUrlId(source) ||
              config?.assetsInclude(cleanUrl(source))) &&
            this.environment.name === "ssr"
          ) {
            this.debug(`Handling main/URL/asset ID in SSR: ${source}`);
            const resolved = await this.resolve(source, importer, options);

            if (!resolved) {
              this.debug(`Failed to resolve: ${source}`);
              return undefined;
            }

            if (isSSGResolveURI(resolved.id)) {
              this.debug(`Already a SSG resolve URI: ${resolved.id}`);
              return resolved;
            }

            this.debug(`Creating SSG resolve URI for: ${resolved.id}`);
            return createSSGResolveURI(resolved.id);
          }

          if (isSSrClientId(source) || isSSrServerId(source)) {
            this.debug(`Bypassing SSR client/server ID: ${source}`);
            return await this.resolve(source, importer, options);
          }

          if (isSSgId(source)) {
            this.debug(`Handling SSG ID: ${source}`);
            if (this.environment.name === "ssr") {
              this.debug(`Resolving SSG ID in SSR environment: ${source}`);
              return await this.resolve(
                addQueryParam(removeSSgQuery(source), "ssr-server"),
                importer,
                { ...options, skipSelf: false },
              );
            } else {
              if (config.command === "build") {
                const name = removeSSgQuery(
                  nodePath.posix
                    .relative(config.root, source)
                    .replace(nodePath.posix.extname(source), ""),
                );

                this.debug(`Emitting virtual HTML file for: ${source}`);
                this.emitFile({
                  id: nodePath.posix.join(
                    nodePath.posix.dirname(source),
                    nodePath.posix.basename(cleanUrl(source)) + "-virtual.html",
                  ),
                  name,
                  type: "chunk",
                  importer: source,
                });
                try {
                  const ssrConfig = config.environments["ssr"]!;

                  const lookUpPaths = getPathsToLookup(name);
                  let serverModulePath: string | undefined;

                  for (const possiblePath of lookUpPaths) {
                    const exists = existsSync(
                      nodePath.join(
                        config.root,
                        ssrConfig.build.outDir,
                        possiblePath + ".js",
                      ),
                    );

                    if (exists) {
                      this.debug(`Found SSG chunk for: ${possiblePath}`);
                      serverModulePath = possiblePath;
                      break;
                    }
                  }

                  if (!serverModulePath) {
                    this.error(`No SSG chunk found for: ${name}`);
                  }

                  const serverApiProvider = await loadServerApi(
                    nodePath.join(
                      config.root,
                      ssrConfig.build.outDir,
                      serverModulePath + `.js`,
                    ),
                  );

                  const serverApi = await serverApiProvider.create({
                    base: mapBaseToUrl("/", config),
                    href: getHrefFromPath(name, config),
                  });

                  const routes = await serverApi.getPathsToPrerender();

                  await serverApi.dispose();
                  await serverApiProvider.dispose();

                  for (let route of routes) {
                    route = stripBase(route, config.base);
                    const id = createSsgUrl(route);
                    if (prerenderedPaths.has(id)) {
                      continue;
                    }
                    prerenderedPaths.add(id);
                    this.emitFile({
                      id,
                      name: route.replace(/^\//, "").replace(/\/$/, "/index"),
                      type: "chunk",
                    });
                  }
                } catch (error) {
                  this.error(`Failed to import routes prerender: ${error}`);
                }
              }
              this.debug(`Resolving SSG ID in client environment: ${source}`);
              return await this.resolve(
                addQueryParam(removeSSgQuery(source), "ssr-client"),
                importer,
                { ...options, skipSelf: false },
              );
            }
          }

          if (isPageURL(source)) {
            this.debug(`Handling page URL: ${source}`);
            const resolved = await this.resolve(source, importer, options);

            if (!resolved) {
              this.debug(`Failed to resolve page URL: ${source}`);
              return undefined;
            }

            if (config.command === "build") {
              let name = nodePath.posix
                .relative(config.root, resolved.id)
                .replace(nodePath.posix.extname(resolved.id), "");

              if (this.environment.name === "ssr") {
                this.debug(
                  `Emitting SSG chunk for SSR environment: ${resolved.id}`,
                );
                this.emitFile({
                  id: addQueryParam(cleanUrl(resolved.id), "ssg"),
                  fileName: name + ".js",
                  name,
                  type: "chunk",
                });
                return this.resolve(
                  createSSGResolveURI(resolved.id),
                  importer,
                  {
                    ...options,
                    skipSelf: false,
                  },
                );
              } else {
                this.debug(
                  `Emitting SSG chunk for client environment: ${resolved.id}`,
                );
                this.emitFile({
                  id: addQueryParam(cleanUrl(resolved.id), "ssg"),
                  name,
                  type: "chunk",
                });
              }
            }

            return resolved.id;
          }

          if (isSsgUrl(source)) {
            this.debug(`Handling SSG URL with path traversal: ${source}`);
            const lookUpPaths = getPathsToLookup(removeSsgUrl(source));

            for (const path of lookUpPaths) {
              let possiblePathId = nodePath.posix.join(config.root, path);

              this.debug(`Trying path: ${possiblePathId}`);
              const query = "?ssg";

              let resolved = await this.resolve(
                possiblePathId + query,
                importer,
                { ...options, skipSelf: false },
              );

              if (resolved) {
                this.debug(`Found match for SSG URL at: ${possiblePathId}`);
                return resolved;
              }
            }

            this.warn(`No match found for SSG URL: ${source}`);
          }

          return undefined;
        },
      },

      load: {
        order: "pre",
        async handler(id) {
          if (id.endsWith("-virtual.html")) {
            this.debug(`Loading virtual HTML: ${id}`);
            return "";
          }
          const config = this.environment.config;

          if (isSSGResolveURI(id)) {
            this.debug(`Loading SSG resolve URI: ${id}`);
            if (isMainId(id)) {
              id = addQueryParam(removeMainQuery(id), "ssr-client");
              this.debug(`Transformed to SSR client: ${id}`);
            }
            id = removeUrlQuery(cleanViteResolveUrl(id));
            if (config.command === "serve") {
              if (id.startsWith(config.root)) {
                id = nodePath.posix.relative(config.root, id);
                this.debug(`Transformed to server URL: ${id}`);
              } else {
                id = mapBaseToUrl("/@fs" + id, config);
                this.debug(`Transformed to fs path: ${id}`);
              }
            }

            return {
              code: `
                export default ${JSON.stringify(id)};
              `,
            };
          }

          if (isMainId(id)) {
            this.debug(`Loading main ID: ${id}`);
            if (config.command === "serve") {
              id = JSON.stringify(
                nodePath.posix.relative(
                  config.root,
                  addQueryParam(removeMainQuery(id), "ssr-client"),
                ),
              );
              this.debug(`Transformed to server URL string: ${id}`);
            } else {
              this.debug(`Emitting chunk for main ID: ${id}`);
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

          const basenameCleanId = nodePath.posix.basename(cleanUrl(id));

          if (isSSrServerId(id)) {
            this.debug(`Loading SSR server module: ${id}`);
            return {
              code: `
                import { create as createServer } from "@wroud/vite-plugin-ssg/react/server";
                import Index from "./${basenameCleanId}";
                import mainScriptUrl from "./${addQueryParam(basenameCleanId, "ssg-main")}";

                export async function create(context) {
                  return await createServer(Index, context, mainScriptUrl);
                }
              `,
            };
          }

          if (isSSrClientId(id)) {
            this.debug(`Loading SSR client module: ${id}`);
            return {
              code: `
                import { create } from "@wroud/vite-plugin-ssg/react/client";
                import htmlTags from "./${addQueryParam(basenameCleanId, "ssg-html-tags")}";
                import Index from "./${basenameCleanId}";
                import mainScriptUrl from "./${addQueryParam(basenameCleanId, "ssg-main")}";
                import { hydrateRoot } from "react-dom/client";
                const context = {}

                const api = await create(Index, context, mainScriptUrl);
                await api.hydrate(htmlTags);
              `,
              moduleSideEffects: true,
            };
          }

          if (isSSgHtmlTagsId(id)) {
            this.debug(`Loading SSG HTML tags: ${id}`);
            return {
              code: `export default __VITE_SSG_HTML_TAGS__;`,
            };
          }

          if (isPageURL(id)) {
            this.debug(`Loading page URL: ${id}`);
            id = removePageURL(cleanViteResolveUrl(id));
            id = nodePath.posix.relative(
              config.root,
              id.replace(nodePath.posix.extname(id), ".html"),
            );

            this.debug(`Transformed page URL: ${id}`);
            return {
              code: `export default ${JSON.stringify(id)};`,
            };
          }

          return undefined;
        },
      },
      async generateBundle(options, bundle) {
        const config = this.environment.config;
        const ssrConfig = config.environments["ssr"]!;
        const assetsMapping = new Map<string, string>();

        const serverApiProviderCache = new Map<
          string,
          Awaited<ReturnType<typeof loadServerApi>>
        >();

        const getCachedServerApi = async (modulePath: string) => {
          if (!serverApiProviderCache.has(modulePath)) {
            serverApiProviderCache.set(
              modulePath,
              await loadServerApi(modulePath),
            );
          }
          return serverApiProviderCache.get(modulePath)!;
        };

        const virtualChunks = new Map(
          Object.entries(bundle).filter(([, chunk]) =>
            chunk.fileName.endsWith("-virtual.html"),
          ) as [string, OutputAsset][],
        );

        for (const [key] of virtualChunks) {
          delete bundle[key];
        }

        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "asset") {
            if (this.environment.name === "client") {
              for (const fileName of chunk.originalFileNames) {
                let absoluteName = fileName;
                if (fileName.startsWith(".")) {
                  absoluteName = nodePath.posix.join(config.root, fileName);
                }
                assetsMapping.set(absoluteName, chunk.fileName);
              }
            }
          } else if (chunk.type === "chunk") {
            if (this.environment.name === "ssr") {
              const ssgIds = chunk.moduleIds
                .filter(isSSGResolveURI)
                .map((id) => {
                  id = cleanViteResolveUrl(id);
                  id = removeUrlQuery(id);
                  id = removeNoInlineQuery(id);

                  if (isMainId(id)) {
                    id = addQueryParam(removeMainQuery(id), "ssr-client");
                  }
                  return id;
                });

              if (ssgIds.length > 0) {
                const outDir = nodePath.join(
                  config.root,
                  config.build.outDir,
                  nodePath.dirname(chunk.fileName),
                );
                const ssgFilePath = nodePath.join(
                  config.root,
                  config.build.outDir,
                  chunk.fileName + ".ssg",
                );

                try {
                  await mkdir(outDir, { recursive: true });
                  await writeFile(ssgFilePath, JSON.stringify(ssgIds, null, 2));
                  this.debug(`Generated SSG file: ${ssgFilePath}`);
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    this.error(
                      new Error(`Failed to generate SSG file: ${ssgFilePath}`, {
                        cause: error,
                      }),
                    );
                  } else {
                    this.error(
                      `Failed to generate SSG file: ${ssgFilePath} - ${String(error)}`,
                    );
                  }
                }
              }
            } else if (chunk.facadeModuleId) {
              assetsMapping.set(chunk.facadeModuleId, chunk.fileName);
            }
          }
        }

        function resolveMainIdFromVirtualChunk(virtualHtmlChunk: OutputAsset) {
          let mainId =
            virtualHtmlChunk.originalFileNames[0]?.replace(
              "-virtual.html",
              "",
            ) || "";

          mainId = mainId.replace(nodePath.extname(mainId), "");

          const mainChunk = Object.values(bundle).find(
            (c) =>
              c.type === "chunk" &&
              c.facadeModuleId?.replace(
                nodePath.extname(c.facadeModuleId),
                "",
              ) === mainId &&
              c.isEntry &&
              isSSrClientId(c.facadeModuleId),
          ) as (OutputChunk & { facadeModuleId: string }) | undefined;

          return mainChunk;
        }

        for (const virtualChunk of virtualChunks.values()) {
          const mainChunk = resolveMainIdFromVirtualChunk(virtualChunk);
          if (mainChunk) {
            assetsMapping.set(
              addQueryParam(
                removeSSrClientQuery(mainChunk.facadeModuleId),
                "page-url",
              ),
              mainChunk.name + ".html",
            );
          }
        }

        if (this.environment.name === "client") {
          const ssgFiles = await glob(["**/*.ssg"], {
            cwd: nodePath.join(config.root, ssrConfig.build.outDir),
          });

          for (let ssg of ssgFiles) {
            ssg = nodePath.join(config.root, ssrConfig.build.outDir, ssg);

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
                serverChunk = serverChunk.replaceAll(ssgId, asset);
              } else {
                this.error(new Error(`Asset not found: ${ssgId}`));
              }
            }

            await writeFile(serverChunkFileName, serverChunk);
            await unlink(ssg);
          }
        }

        try {
          for (const [, virtualHtmlChunk] of virtualChunks) {
            const mainChunk = resolveMainIdFromVirtualChunk(virtualHtmlChunk);
            if (!mainChunk) {
              continue;
            }

            const href = mainChunk.name.replace(/\/index$/, "/");
            const lookUpPaths = getPathsToLookup(
              stripBase(mainChunk.name, config.base),
            );
            let serverModulePath: string | undefined;

            for (const possiblePath of lookUpPaths) {
              const exists = existsSync(
                nodePath.join(
                  config.root,
                  ssrConfig.build.outDir,
                  possiblePath + ".js",
                ),
              );

              if (exists) {
                this.debug(`Found SSG chunk for: ${possiblePath}`);
                serverModulePath = possiblePath;
                break;
              }
            }

            if (!serverModulePath) {
              this.error(`No SSG chunk found for: ${mainChunk.name}`);
            }

            const serverModuleFullPath = nodePath.join(
              config.root,
              ssrConfig.build.outDir,
              serverModulePath + ".js",
            );

            const serverApiProvider =
              await getCachedServerApi(serverModuleFullPath);

            const analyzedChunk = new Set<string>();
            const cssFiles = new Set<string>();
            const htmlTags = parseHtmlTagsFromHtml(
              String(virtualHtmlChunk.source),
            );

            function collectCssForChunk(chunk: OutputChunk): void {
              const chunkId = chunk.fileName;
              if (analyzedChunk.has(chunkId)) return;
              analyzedChunk.add(chunkId);

              if (chunk.imports.length > 0) {
                for (const importFile of chunk.imports) {
                  const importedChunk = bundle[importFile];
                  if (importedChunk?.type === "chunk") {
                    collectCssForChunk(importedChunk);
                  }
                }
              }

              if (chunk.viteMetadata?.importedCss) {
                for (const cssFile of chunk.viteMetadata.importedCss) {
                  cssFiles.add(cssFile);
                }
              }
            }

            if (mainChunk) {
              collectCssForChunk(mainChunk);
            }

            for (const cssFile of cssFiles) {
              htmlTags.push({
                tag: "link",
                injectTo: "head",
                attrs: {
                  rel: "stylesheet",
                  crossorigin: true,
                  href: cssFile,
                },
              });
            }

            function replaceSsgHtmlTagsInChunk(chunk: OutputChunk) {
              const s = new MagicString(chunk.code);
              s.replace("__VITE_SSG_HTML_TAGS__", JSON.stringify(htmlTags));

              chunk.code = s.toString();
              if (chunk.map) {
                chunk.map = s.generateMap();
              }
            }
            if (mainChunk.moduleIds.some((m) => m.includes("?ssg-html-tag"))) {
              replaceSsgHtmlTagsInChunk(mainChunk);
            } else {
              for (const importedModule of mainChunk.imports) {
                const importedModuleChunk = bundle[importedModule];
                if (
                  importedModuleChunk?.type === "chunk" &&
                  importedModuleChunk.moduleIds.some((m) =>
                    m.includes("?ssg-html-tag"),
                  )
                ) {
                  replaceSsgHtmlTagsInChunk(importedModuleChunk);
                  break;
                }
              }
            }

            const serverApi = await serverApiProvider.create({
              href: getHrefFromPath(href, config),
              cspNonce: config.html?.cspNonce,
              base: getBaseInHTML(href, config),
            });

            const source = await serverApi.render(
              mapHtmlTagsToReactTags(htmlTags),
              pluginOptions.renderTimeout,
            );

            await serverApi.dispose();

            this.emitFile({
              type: "asset",
              fileName: mainChunk.name + ".html",
              source,
            });
          }
        } finally {
          for (const provider of serverApiProviderCache.values()) {
            await provider.dispose();
          }
          serverApiProviderCache.clear();
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
    const urlSearch = req.url?.split("?")[1] || "";
    let url = cleanUrl(req.url);
    if (res.writableEnded || !isDev || url === undefined) {
      return next();
    }

    if (url?.endsWith("/")) {
      url = url + "index.html";
    }

    if (
      (url?.endsWith("/") || url?.endsWith(".html")) &&
      req.headers["sec-fetch-dest"] !== "script"
    ) {
      const headers = server.config.server.headers;

      try {
        const html = await server.transformIndexHtml(url, "", req.originalUrl);

        const htmlTags = parseHtmlTagsFromHtml(html);

        let entry = decodeURIComponent(url);
        entry = nodePath.posix.join(
          "/@ssg/",
          entry.replace(nodePath.posix.extname(entry), ""),
        );

        const entryModule = await server.moduleGraph.ensureEntryFromUrl(entry);

        if (entryModule.id) {
          const tagsModule = await server.moduleGraph.ensureEntryFromUrl(
            addQueryParam(cleanUrl(entryModule.id), "ssg-html-tags"),
          );

          server.moduleGraph.updateModuleTransformResult(tagsModule, {
            code: `export default ${JSON.stringify(htmlTags)};`,
            map: null,
          });
        }

        const { create: createServerApi } = await moduleRunner.import(entry);
        const href =
          url.replace(/^\//, "").replace(/\/index\.html$/, "/") +
          (urlSearch ? "?" + urlSearch : "");

        const serverApi = await (createServerApi as BoundServerApiFunction)({
          href: getHrefFromPath(href, server.config),
          cspNonce: server.config.html?.cspNonce,
          base:
            (server.config.server.origin ?? "") +
            getBaseInHTML(href, server.config),
        });

        const renderedHtml = await serverApi.render(
          htmlTags,
          pluginOptions.renderTimeout,
        );

        await serverApi.dispose();

        return send(req, res, renderedHtml, "html", {
          headers,
          cacheControl: "no-cache",
        });
      } catch (e) {
        if (e instanceof Error) {
          const error = new Error(`SSG HTML processing failed: ${e.message}`, {
            cause: e,
          });
          error.stack = error.stack ?? "" + e.stack;
          return next(error);
        }
        return next(e);
      }
    }
    next();
  };
}

function getHrefFromPath(url: string, config: ResolvedConfig) {
  return new URL(mapBaseToUrl(url, config), "http://localhost/").href;
}

function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  return config.base === "./" || config.base === ""
    ? nodePath.posix.join(nodePath.posix.relative(urlRelativePath, ""), "./")
    : config.base;
}

function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== "/") {
    return `${path}/`;
  }
  return path;
}

function stripBase(path: string, base: string): string {
  if (path === base) {
    return "/";
  }
  const devBase = withTrailingSlash(base);
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path;
}

function mapBaseToUrl(url: string, config: ResolvedConfig) {
  if (config.base === "./" || config.base === "") {
    return url;
  }

  return nodePath.posix.join(config.base, url);
}
