import { type Connect, type PreviewServer, type ViteDevServer } from "vite";

export function assetsMiddleware(
  server: ViteDevServer | PreviewServer,
  playgroundPath: string,
): Connect.NextHandleFunction {
  const isDev = "pluginContainer" in server;

  return async function viteIndexHtmlMiddleware(req, res, next) {
    const [url, urlSearch] = (req.url || "")?.split("?") as [
      string,
      string | undefined,
    ];
    const assetsBase = `/${playgroundPath}/assets/`;

    if (res.writableEnded || !isDev || !url.startsWith(assetsBase)) {
      return next();
    }

    try {
      const path = import.meta.resolve(
        "../../public/" + url.replace(assetsBase, ""),
      );

      req.url =
        path.replace("file://", "/@fs") + (urlSearch ? "?" + urlSearch : "");
    } catch (e) {
      return next(e);
    }

    return next();
  };
}
