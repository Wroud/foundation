import nodePath from "node:path";
import { type PluginOption, createRunnableDevEnvironment } from "vite";
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
import { cleanSsgAssetId } from "./modules/isSsgAssetId.js";
import { isSsgHtmlTagsId } from "./utils/ssgHtmlTags.js";
import {
  createSsgPageUrlId,
  isSsgPageUrlId,
  removeSsgPageUrlId,
} from "./modules/isSsgPageUrlId.js";
import { createSsgUrl, isSsgUrl, removeSsgUrl } from "./modules/isSsgUrl.js";
import { getPathsToLookup } from "./utils/getPathsToLookup.js";
import { existsSync } from "node:fs";
import { loadServerApi } from "./api/loadServerApi.js";
import {
  createSsgEntryQuery,
  isSsgEntryQuery,
  removeSsgEntryQuery,
} from "./modules/ssgEntryQuery.js";
import { createVirtualHtmlEntry } from "./modules/isVirtualHtmlEntry.js";
import { createSsgComponentId } from "./modules/isSsgComponentId.js";
import { getPageName } from "./utils/getPageName.js";
import { ssgComponentResolution } from "./resolvers/ssgComponentResolution.js";
import { ssgAssetsResolutionPlugin } from "./resolvers/ssgAssetsResolution.js";
import { viteFsFallbackResolutionPlugin } from "./resolvers/viteFsFallbackResolution.js";
import { changePathExt } from "./utils/changePathExt.js";
import type { SsgPluginOptions } from "./SsgPluginOptions.js";
import { pagesMiddleware } from "./server/pages-middleware.js";
import { getHrefFromPath } from "./utils/getHrefFromPath.js";
import { mapBaseToUrl } from "./utils/mapBaseToUrl.js";
import { ssrBundlePlugin } from "./resolvers/ssrBundlePlugin.js";
import { clientBundlePlugin } from "./resolvers/clientBundlePlugin.js";
import { stripBase } from "./utils/stripBase.js";

export * from "./react/IndexComponent.js";

export const ssgPlugin = (
  pluginOptions: SsgPluginOptions = {
    renderTimeout: 10000,
  },
): PluginOption => {
  const emittedPages = new Set<string>();
  return [
    viteFsFallbackResolutionPlugin(),
    ssgAssetsResolutionPlugin(),
    ssrBundlePlugin(),
    clientBundlePlugin(pluginOptions.renderTimeout),
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
        // userConfig.resolve = {
        //   ...userConfig.resolve,
        //   dedupe: [
        //     ...(userConfig.resolve?.dedupe || []),
        //     "@wroud/vite-plugin-ssg",
        //   ],
        // };
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
            isSsgHtmlTagsId(source) ||
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
                importer: source,
                preserveSignature: "strict",
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

            if (
              config.command === "build" &&
              this.environment.name === "client"
            ) {
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
              moduleType: "js",
            };
          }

          if (isSsgServerEntryId(id)) {
            return {
              code: `
                import { create as createServer } from "@wroud/vite-plugin-ssg/react/server";
                import Index from "${addQueryParam(cleanUrl(id), "server")}";
                import mainScriptUrl from "${addMainQuery(cleanUrl(id))}";

                export async function create(context) {
                  return await createServer(Index, context, mainScriptUrl);
                }
              `,
              moduleType: "js",
            };
          }

          if (isSsgClientEntryId(id)) {
            return {
              code: `
                import { create } from "@wroud/vite-plugin-ssg/react/client";
                import htmlTags from "${addQueryParam(cleanUrl(id), "ssg-html-tags")}";
                import Index from "${addQueryParam(cleanUrl(id), "client")}";
                import mainScriptUrl from "${addMainQuery(cleanUrl(id))}";
                const context = {}

                const api = await create(Index, context, mainScriptUrl);
                await api.hydrate(htmlTags);
              `,
              moduleSideEffects: true,
              moduleType: "js",
            };
          }

          if (isSsgHtmlTagsId(id)) {
            return {
              code: `export default __VITE_SSG_HTML_TAGS__;`,
              moduleType: "js",
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
              moduleType: "js",
            };
          }

          return undefined;
        },
      },
    },
    ssgComponentResolution(),
  ];
};
