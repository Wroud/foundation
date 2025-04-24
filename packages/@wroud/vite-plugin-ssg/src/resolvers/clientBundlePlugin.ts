import nodePath from "node:path";
import { type PluginOption } from "vite";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { changePathExt } from "../utils/changePathExt.js";
import { loadServerApi } from "../api/loadServerApi.js";
import type { OutputAsset, OutputChunk } from "rollup";
import { getPageName } from "../utils/getPageName.js";
import { removeVirtualHtmlEntry } from "../modules/isVirtualHtmlEntry.js";
import { getPathsToLookup } from "../utils/getPathsToLookup.js";
import { isSsgClientEntryId } from "../modules/isSsgClientEntryId.js";
import { createSsgPageUrlId } from "../modules/isSsgPageUrlId.js";
import { cleanUrl } from "../utils/cleanUrl.js";
import { glob } from "tinyglobby";
import { existsSync } from "node:fs";
import { parseHtmlTagsFromHtml } from "../parseHtmlTagsFromHtml.js";
import MagicString from "magic-string";
import { getHrefFromPath } from "../utils/getHrefFromPath.js";
import { getBaseInHTML } from "../utils/getBaseInHTML.js";
import { mapHtmlTagsToReactTags } from "../react/mapHtmlTagsToReactTags.js";
import { htmlVirtualEntryResolution } from "./htmlVirtualEntryResolution.js";
import { stripBase } from "../utils/stripBase.js";

export const clientBundlePlugin = (renderTimeout = 10000): PluginOption => {
  const virtualHtmlEntryPlugin = htmlVirtualEntryResolution();
  return [
    virtualHtmlEntryPlugin,
    {
      name: "@wroud/vite-plugin-ssg/client",
      enforce: "post",
      apply: "build",
      applyToEnvironment: (env) => env.name === "client",
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
              for (const fileName of chunk.originalFileNames) {
                let absoluteName = fileName;
                if (fileName.startsWith(".")) {
                  absoluteName = nodePath.posix.join(config.root, fileName);
                }
                assetsMapping.set(absoluteName, chunk.fileName);
              }
            } else if (chunk.type === "chunk") {
              if (chunk.facadeModuleId) {
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
                renderTimeout,
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
  ];
};
