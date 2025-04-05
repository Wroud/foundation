import {
  type Connect,
  isRunnableDevEnvironment,
  send,
  type PreviewServer,
  type ViteDevServer,
} from "vite";
import { createSsgUrl } from "../modules/isSsgUrl.js";
import { parseHtmlTagsFromHtml } from "../parseHtmlTagsFromHtml.js";
import type { BoundServerApiFunction } from "../react/server.js";
import { changePathExt } from "../utils/changePathExt.js";
import { cleanUrl } from "../utils/cleanUrl.js";
import { addQueryParam } from "../utils/queryParam.js";
import type { SsgPluginOptions } from "../SsgPluginOptions.js";
import { getBaseInHTML } from "../utils/getBaseInHTML.js";
import { getHrefFromPath } from "../utils/getHrefFromPath.js";

export function pagesMiddleware(
  server: ViteDevServer | PreviewServer,
  pluginOptions: SsgPluginOptions,
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
        let html = await server.transformIndexHtml(url, "", req.originalUrl);
        html = await server.transformIndexHtml(url, "", req.originalUrl);

        const htmlTags = parseHtmlTagsFromHtml(html);

        let entry = decodeURIComponent(url);
        entry = createSsgUrl(changePathExt(entry, "")).replace("/index", "/");

        const clientEntryModule = await server.moduleGraph.ensureEntryFromUrl(
          entry,
          false,
        );

        const clientTagsModule = await server.moduleGraph.ensureEntryFromUrl(
          addQueryParam(cleanUrl(clientEntryModule.id!), "ssg-html-tags"),
          false,
        );

        server.moduleGraph.updateModuleTransformResult(
          clientTagsModule,
          {
            code: `export default ${JSON.stringify(htmlTags)};`,
            map: null,
          },
          false,
        );

        if (!isRunnableDevEnvironment(server.environments.ssr)) {
          throw new Error("SSG is not supported in this environment");
        }

        const { create: createServerApi } =
          await server.environments.ssr.runner.import(entry);
        const href =
          url.replace(/^\//, "").replace(/\/index\.html$/, "/") +
          (urlSearch ? "?" + urlSearch : "");

        let base =
          (server.config.server.origin ?? "") +
          getBaseInHTML(href, server.config);

        const serverApi = await (createServerApi as BoundServerApiFunction)({
          href: getHrefFromPath(href, server.config),
          cspNonce: server.config.html?.cspNonce,
          base,
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
