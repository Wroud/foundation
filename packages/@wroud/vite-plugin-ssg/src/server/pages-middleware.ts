import {
  type Connect,
  isRunnableDevEnvironment,
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
import { isDevServer } from "../utils/isDevServer.js";
import { stripIndexFromPath } from "../utils/stripIndexFromPath.js";

export function pagesMiddleware(
  server: ViteDevServer | PreviewServer,
  pluginOptions: SsgPluginOptions,
): Connect.NextHandleFunction {
  const isDev = isDevServer(server);

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
        const html = await server.transformIndexHtml(
          url,
          "",
          req.originalUrl,
        );

        const htmlTags = parseHtmlTagsFromHtml(html);

        let entry = decodeURIComponent(url);
        entry = stripIndexFromPath(createSsgUrl(changePathExt(entry, "")));

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

        if (res.writableEnded) {
          return;
        }

        res.setHeader("Cache-Control", "no-cache");
        if (headers) {
          for (const name in headers) {
            res.setHeader(name, headers[name]!);
          }
        }

        if (req.method === "HEAD") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.end();
          return;
        }

        const { create: createServerApi } =
          await server.environments.ssr.runner.import(entry);
        const href =
          url.replace(/^\//, "").replace(/(\/|^)index\.html$/, "/") +
          (urlSearch ? "?" + urlSearch : "");

        let base =
          (server.config.server.origin ?? "") +
          getBaseInHTML(href, server.config);

        const serverApi = await (createServerApi as BoundServerApiFunction)({
          href: getHrefFromPath(href, server.config),
          cspNonce: server.config.html?.cspNonce,
          base,
          headers: req.headers as Record<string, string | string[] | undefined>,
        });

        try {
          await serverApi.stream(res, htmlTags, pluginOptions.renderTimeout);
        } finally {
          await serverApi.dispose();
        }
        return;
      } catch (e) {
        console.error(e);
        if (res.headersSent) {
          // Caveat: once `serverApi.stream` calls `pipe(response)` from
          // onShellReady, status + headers are flushed. A later rejection
          // (e.g. Suspense boundary error during async rendering) lands
          // here, but Connect's error path can no longer write an error
          // page. Best we can do is end the stream cleanly.
          res.end();
          return;
        }
        if (e instanceof Error) {
          const error = new Error(`SSG HTML processing failed: ${e.message}`, {
            cause: e,
          });
          return next(error);
        }
        return next(e);
      }
    }
    next();
  };
}
