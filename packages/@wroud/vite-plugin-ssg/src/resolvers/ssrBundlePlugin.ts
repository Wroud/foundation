import nodePath from "node:path";
import { type PluginOption } from "vite";
import { removeUrlQuery } from "../modules/removeUrlQuery.js";
import { createSsgClientEntryId } from "../modules/isSsgClientEntryId.js";
import { isMainId, removeMainQuery } from "../modules/mainQuery.js";
import { cleanSsgAssetId, isSsgAssetId } from "../modules/isSsgAssetId.js";
import { mkdir, writeFile } from "node:fs/promises";
import { isSsgPageUrlId } from "../modules/isSsgPageUrlId.js";
import { removeNoInlineQuery } from "../utils/removeNoInlineQuery.js";
import { changePathExt } from "../utils/changePathExt.js";

export const ssrBundlePlugin = (): PluginOption => {
  return [
    {
      name: "@wroud/vite-plugin-ssg/ssr",
      enforce: "post",
      apply: "build",
      applyToEnvironment: (env) => env.name === "ssr",
      generateBundle: {
        order: "post",
        async handler(options, bundle) {
          const config = this.environment.config;

          for (const chunk of Object.values(bundle)) {
            if (chunk.type === "chunk") {
              const ssgIds = chunk.moduleIds.filter(isSsgAssetId).map((id) => {
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
                  await writeFile(ssgFilePath, JSON.stringify(ssgIds, null, 2));
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
            }
          }
        },
      },
    },
  ];
};
