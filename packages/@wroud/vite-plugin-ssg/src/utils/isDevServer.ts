import type { ViteDevServer, PreviewServer } from "vite";

export function isDevServer(
  server: ViteDevServer | PreviewServer,
): server is ViteDevServer {
  return "pluginContainer" in server;
}
