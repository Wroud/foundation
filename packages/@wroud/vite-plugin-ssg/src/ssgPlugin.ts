import nodePath from "node:path";
import { type PluginOption, createRunnableDevEnvironment } from "vite";
import { removeUrlQuery } from "./modules/removeUrlQuery.js";
import { cleanUrl } from "./utils/cleanUrl.js";
import { createSsgId, isSsgId, removeSsgQuery } from "./modules/isSsgId.js";
import {
  createSsgServerEntryId,
  isSsgServerEntryId,
} from "./modules/isSsgServerEntryId.js";
import {
  createSsgClientEntryId,
  isSsgClientEntryId,
} from "./modules/isSsgClientEntryId.js";
import {
  addMainQuery,
  isMainId,
  removeMainQuery,
} from "./modules/mainQuery.js";
import { addQueryParam, parseQueryParams } from "./utils/queryParam.js";
import { cleanSsgAssetId, isSsgAssetId } from "./modules/isSsgAssetId.js";
import { mapHtmlTagsToReactTags } from "./react/mapHtmlTagsToReactTags.js";
import { parseHtmlTagsFromHtml } from "./parseHtmlTagsFromHtml.js";
import type { OutputAsset, OutputChunk } from "rollup";
import MagicString from "magic-string";
import { isSSgHtmlTagsId } from "./utils/ssgHtmlTags.js";
import { glob } from "tinyglobby";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import {
  createSsgPageUrlId,
  isSsgPageUrlId,
  removeSsgPageUrlId,
} from "./modules/isSsgPageUrlId.js";
import { createSsgUrl, isSsgUrl, removeSsgUrl } from "./modules/isSsgUrl.js";
import { getPathsToLookup } from "./utils/getPathsToLookup.js";
import { existsSync } from "node:fs";
import { removeNoInlineQuery } from "./utils/removeNoInlineQuery.js";
import { loadServerApi } from "./api/loadServerApi.js";
import {
  createSsgEntryQuery,
  isSsgEntryQuery,
  removeSsgEntryQuery,
} from "./modules/ssgEntryQuery.js";
import {
  createVirtualHtmlEntry,
  removeVirtualHtmlEntry,
} from "./modules/isVirtualHtmlEntry.js";
import { createSsgComponentId } from "./modules/isSsgComponentId.js";
import { getPageName } from "./utils/getPageName.js";
import { ssgComponentResolution } from "./resolvers/ssgComponentResolution.js";
import { htmlVirtualEntryResolution } from "./resolvers/htmlVirtualEntryResolution.js";
import { ssgAssetsResolutionPlugin } from "./resolvers/ssgAssetsResolution.js";
import { withTrailingSlash } from "./utils/withTrailingSlash.js";
import { viteFsFallbackResolutionPlugin } from "./resolvers/viteFsFallbackResolution.js";
import { changePathExt } from "./utils/changePathExt.js";
import type { SsgPluginOptions } from "./SsgPluginOptions.js";
import { pagesMiddleware } from "./server/pages-middleware.js";
import { getHrefFromPath } from "./utils/getHrefFromPath.js";
import { getBaseInHTML } from "./utils/getBaseInHTML.js";
import { mapBaseToUrl } from "./utils/mapBaseToUrl.js";

export * from "./react/IndexComponent.js";

export const ssgPlugin = (
  pluginOptions: SsgPluginOptions = {
    renderTimeout: 10000,
  },
): PluginOption => {
  const virtualHtmlEntryPlugin = htmlVirtualEntryResolution();
  const emittedPages = new Set<string>();
  return [
    viteFsFallbackResolutionPlugin(),
    ssgAssetsResolutionPlugin(),
    {
      name: "@wroud/vite-plugin-ssg",
      enforce: "post",

      config(userConfig, env) {
        userConfig.environments = {
          ...userConfig.environments,
          ssr: {
            ...userConfig.environments?.["ssr"],

            dev: {
              ...userConfig.environments?.["ssr"]?.dev,
              createEnvironment(name, config) {
                return createRunnableDevEnvironment(name, config, {
                  runnerOptions: { hmr: { logger: false } },
                });
              },
            },
            // resolve: {
            //   dedupe: ["@wroud/vite-plugin-ssg"],
            // },
            build: {
              ...userConfig.environments?.["ssr"]?.build,
              ssr: true,
              rollupOptions: {
                ...userConfig.environments?.["ssr"]?.build?.rollupOptions,
                // external:
                //   env.command === "build"
                //     ? [/^@wroud\/vite-plugin-ssg.*/]
                //     : undefined,
              },
              outDir:
                (userConfig.environments?.["ssr"]?.build?.outDir ||
                  userConfig.build?.outDir ||
                  "dist") + "-server",
            },
          },
        };
        userConfig.resolve = {
          ...userConfig.resolve,
          // dedupe: [
          //   ...(userConfig.resolve?.dedupe || []),
          //   "@wroud/vite-plugin-ssg",
          // ],
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
          emittedPages.clear();
        },
      },
      configureServer: {
        order: "pre",
        async handler(server) {
          return () => {
            server.middlewares.use(pagesMiddleware(server, pluginOptions));
          };
        },
      },
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          const config = this.environment.config;

          if (
            isSsgClientEntryId(source) ||
            isSsgServerEntryId(source) ||
            isSSgHtmlTagsId(source) ||
            (importer &&
              isMainId(source) &&
              (isSsgClientEntryId(importer) || isSsgServerEntryId(importer)))
          ) {
            const params = parseQueryParams(source);
            const componentResolved = await this.resolve(
              createSsgComponentId(cleanUrl(source)),
              source,
              options,
            );

            if (!componentResolved) {
              return null;
            }

            return addQueryParam(
              cleanUrl(componentResolved.id),
              Object.keys(params)[0]!,
            );
          }

          if (isSsgId(source)) {
            if (this.environment.name === "ssr") {
              source = createSsgServerEntryId(removeSsgQuery(source));
            } else {
              source = createSsgClientEntryId(removeSsgQuery(source));
            }
            return await this.resolve(source, importer, {
              ...options,
              skipSelf: false,
            });
          }

          if (isSsgPageUrlId(source)) {
            const alreadyResolved =
              options.custom?.["@wroud/vite-plugin-ssg:page-url-id"]?.resolved;
            if (alreadyResolved) {
              return alreadyResolved;
            }

            const resolved = await this.resolve(
              removeSsgPageUrlId(source),
              importer,
              options,
            );

            if (!resolved) {
              this.error(`Failed to resolve SSG page URL: ${source}`);
              //@ts-ignore
              return null;
            }

            if (config.command === "build") {
              const name = nodePath.posix.relative(
                config.root,
                changePathExt(resolved.id, ""),
              );

              this.emitFile({
                id: createSsgEntryQuery(changePathExt(resolved.id, "")),
                name,
                fileName:
                  this.environment.name === "ssr"
                    ? changePathExt(name, ".js")
                    : undefined,
                type: "chunk",
              });
            }

            return this.resolve(
              changePathExt(createSsgPageUrlId(resolved.id), ""),
              importer,
              {
                ...options,
                custom: {
                  ...options.custom,
                  "@wroud/vite-plugin-ssg:page-url-id": {
                    resolved: changePathExt(
                      createSsgPageUrlId(resolved.id),
                      "",
                    ),
                  },
                },
              },
            );
          }

          if (isSsgEntryQuery(source)) {
            source = nodePath.posix.resolve(config.root, source);
            let resolvedId = await this.resolve(
              createSsgId(removeSsgEntryQuery(source)),
              importer,
              {
                ...options,
                skipSelf: false,
              },
            );

            if (!resolvedId) {
              this.error(`Failed to resolve SSG entry query: ${source}`);
            }

            if (config.command === "build") {
              if (this.environment.name === "client") {
                let name = nodePath.posix.relative(
                  config.root,
                  changePathExt(removeSsgEntryQuery(source), ""),
                );
                this.emitFile({
                  id: createVirtualHtmlEntry(
                    nodePath.posix.join(config.root, name),
                  ),
                  name,
                  type: "chunk",
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

                    if (emittedPages.has(id)) {
                      continue;
                    }
                    emittedPages.add(id);

                    const name = getPageName(route);

                    this.emitFile({
                      id,
                      name,
                      type: "chunk",
                    });
                  }
                } catch (error) {
                  this.error(`Failed to import routes prerender: ${error}`);
                }
              }
            }

            return resolvedId;
          }

          if (isSsgUrl(source)) {
            return this.resolve(
              createSsgEntryQuery(removeSsgUrl(source)),
              importer,
              {
                ...options,
                skipSelf: false,
              },
            );
          }

          return undefined;
        },
      },

      load: {
        order: "pre",
        async handler(id) {
          const config = this.environment.config;

          if (isSsgAssetId(id)) {
            if (isSsgPageUrlId(id)) {
              id = changePathExt(id, "");

              if (config.command === "serve") {
                id = removeSsgPageUrlId(cleanSsgAssetId(id));
                id = changePathExt(
                  nodePath.posix.relative(config.root, id),
                  ".html",
                );

                return {
                  code: `export default ${JSON.stringify(id)};`,
                };
              }
            }

            if (isMainId(id)) {
              id = createSsgClientEntryId(removeMainQuery(id));
            }
            id = removeUrlQuery(cleanSsgAssetId(id));
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
            if (config.command === "serve") {
              if (id.startsWith(config.root)) {
                id = nodePath.posix.relative(config.root, id);
                this.debug(`Transformed to server URL: ${id}`);
              } else {
                id = mapBaseToUrl("/@fs" + id, config);
                this.debug(`Transformed to fs path: ${id}`);
              }
              id = JSON.stringify(createSsgClientEntryId(removeMainQuery(id)));
            } else {
              id = `import.meta.ROLLUP_FILE_URL_${this.emitFile({
                type: "chunk",
                id: createSsgClientEntryId(removeMainQuery(id)),
              })}`;
            }

            return {
              code: `
                export default ${id};
              `,
            };
          }

          if (isSsgServerEntryId(id)) {
            return {
              code: `
                import { create as createServer } from "@wroud/vite-plugin-ssg/react/server";
                import Index from "${cleanUrl(id)}?server";
                import mainScriptUrl from "${addMainQuery(cleanUrl(id))}";

                export async function create(context) {
                  return await createServer(Index, context, mainScriptUrl);
                }
              `,
            };
          }

          if (isSsgClientEntryId(id)) {
            return {
              code: `
                import { create } from "@wroud/vite-plugin-ssg/react/client";
                import htmlTags from "${addQueryParam(cleanUrl(id), "ssg-html-tags")}";
                import Index from "${cleanUrl(id)}?client";
                import mainScriptUrl from "${addMainQuery(cleanUrl(id))}";
                const context = {}

                const api = await create(Index, context, mainScriptUrl);
                await api.hydrate(htmlTags);
              `,
              moduleSideEffects: true,
            };
          }

          if (isSSgHtmlTagsId(id)) {
            return {
              code: `export default __VITE_SSG_HTML_TAGS__;`,
            };
          }

          if (isSsgPageUrlId(id)) {
            id = removeSsgPageUrlId(cleanSsgAssetId(id));
            id = changePathExt(
              nodePath.posix.relative(config.root, id),
              ".html",
            );

            return {
              code: `export default ${JSON.stringify(id)};`,
            };
          }

          return undefined;
        },
      },
      generateBundle: {
        order: "post",
        async handler(options, bundle) {
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

          const virtualChunks =
            virtualHtmlEntryPlugin.virtualHtmlChunks ||
            new Map<string, OutputAsset>();

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
                  .filter(isSsgAssetId)
                  .map((id) => {
                    id = cleanSsgAssetId(id);
                    id = removeUrlQuery(id);
                    id = removeNoInlineQuery(id);

                    if (isMainId(id)) {
                      id = createSsgClientEntryId(removeMainQuery(id));
                    }

                    if (isSsgPageUrlId(id)) {
                      id = changePathExt(id, "");
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
                    await writeFile(
                      ssgFilePath,
                      JSON.stringify(ssgIds, null, 2),
                    );
                  } catch (error: unknown) {
                    if (error instanceof Error) {
                      this.error(
                        new Error(
                          `Failed to generate SSG file: ${ssgFilePath}`,
                          {
                            cause: error,
                          },
                        ),
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

          function resolveMainIdFromVirtualChunk(
            virtualHtmlChunk: OutputAsset,
          ) {
            let mainName =
              getPageName(
                removeVirtualHtmlEntry(
                  nodePath.posix.relative(
                    config.root,
                    virtualHtmlChunk.originalFileNames[0] ?? "",
                  ),
                ),
              ) || "";

            const lookUpPaths = getPathsToLookup(mainName);

            for (const possiblePath of lookUpPaths) {
              const mainChunk = Object.values(bundle).find(
                (c) =>
                  c.type === "chunk" &&
                  c.name === possiblePath &&
                  c.isEntry &&
                  isSsgClientEntryId(c.facadeModuleId ?? ""),
              ) as (OutputChunk & { facadeModuleId: string }) | undefined;

              if (mainChunk) {
                return {
                  name: mainName,
                  chunkName: possiblePath,
                  chunk: mainChunk,
                };
              }
            }
            return null;
          }

          for (const virtualChunk of virtualChunks.values()) {
            const mainChunk = resolveMainIdFromVirtualChunk(virtualChunk);
            if (mainChunk) {
              assetsMapping.set(
                createSsgPageUrlId(
                  changePathExt(cleanUrl(mainChunk.chunk.facadeModuleId), ""),
                ),
                mainChunk.chunkName + ".html",
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
                this.warn(
                  `No main chunk found for: ${virtualHtmlChunk.fileName}`,
                );
                continue;
              }

              const href = mainChunk.name.replace(/\/index$/, "/");
              let serverModulePath = stripBase(
                mainChunk.chunkName,
                config.base,
              );

              const exists = existsSync(
                nodePath.join(
                  config.root,
                  ssrConfig.build.outDir,
                  serverModulePath + ".js",
                ),
              );

              if (!exists) {
                this.error(`No SSG chunk found for: ${mainChunk.name}`);
                //@ts-ignore
                return;
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
                collectCssForChunk(mainChunk.chunk);
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
              if (
                mainChunk.chunk.moduleIds.some((m) =>
                  m.includes("?ssg-html-tag"),
                )
              ) {
                replaceSsgHtmlTagsInChunk(mainChunk.chunk);
              } else {
                for (const importedModule of mainChunk.chunk.imports) {
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
    },
    ssgComponentResolution(),
    virtualHtmlEntryPlugin,
  ];
};

function stripBase(path: string, base: string): string {
  if (path === base) {
    return "/";
  }
  const devBase = withTrailingSlash(base);
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path;
}
