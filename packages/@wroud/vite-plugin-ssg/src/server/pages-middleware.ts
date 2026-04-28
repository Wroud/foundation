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
import type {
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from "http";
import { Writable } from "stream";

export function pagesMiddleware(
  server: ViteDevServer | PreviewServer,
  pluginOptions: SsgPluginOptions,
): Connect.NextHandleFunction {
  const isDev = isDevServer(server);

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
      try {
        const html = await server.transformIndexHtml(url, "", req.originalUrl);

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
          const stream = await serverApi.render(
            htmlTags,
            pluginOptions.renderTimeout,
          );

          return await pipe(req, res, stream, server.config.server.headers);
        } finally {
          await serverApi.dispose();
        }
      } catch (e) {
        console.error(e);
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

async function pipe(
  req: IncomingMessage,
  res: ServerResponse,
  stream: ReadableStream,
  headers: OutgoingHttpHeaders,
) {
  if (res.writableEnded) {
    return;
  }

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");

  if (headers) {
    for (const name in headers) {
      res.setHeader(name, headers[name]!);
    }
  }
  res.statusCode = 200;

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  await stream.pipeTo(Writable.toWeb(res));
}
